import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

const HOST = process.env.AZURE_FUNC_HOST!;
const KEY_GET_SAS = process.env.AZURE_FUNC_KEY_GET_SAS!;
const KEY_START = process.env.AZURE_FUNC_KEY_HTTP_START!;
const TIMEOUT_MS = Number(process.env.AZURE_PIPELINE_TIMEOUT_MS ?? 90000);
const POLL_MS = Number(process.env.AZURE_PIPELINE_POLL_MS ?? 2000);

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: NextRequest) {
  try {
    // 1) Leer el archivo del form-data
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const contentType = file.type || "application/octet-stream";
    const arrayBuf = await file.arrayBuffer();
    const bodyBytes = Buffer.from(arrayBuf);

    // 2) Pedir SAS de upload (input/uploads/<uuid>.<ext>)
    const ext = file.name.includes(".")
      ? file.name.substring(file.name.lastIndexOf("."))
      : "";
    const blobName = `uploads/${randomUUID()}${ext}`;
    const sasReq = {
      container: "input",
      blobName,
      mode: "upload",
      minutes: 15,
      contentType,
    };

    const sasUploadRes = await fetch(`https://${HOST}/api/sas`, {
      method: "POST",
      headers: {
        "x-functions-key": KEY_GET_SAS,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sasReq),
    });

    if (!sasUploadRes.ok) {
      const text = await sasUploadRes.text();
      return NextResponse.json(
        { error: `get_sas(upload) failed: ${text}` },
        { status: 502 }
      );
    }
    const { sasUrl } = (await sasUploadRes.json()) as { sasUrl: string };
    if (!sasUrl) {
      return NextResponse.json(
        { error: "Missing sasUrl from get_sas(upload)" },
        { status: 502 }
      );
    }

    // 3) Subir el archivo al SAS URL (PUT)
    const putRes = await fetch(sasUrl, {
      method: "PUT",
      headers: {
        "x-ms-blob-type": "BlockBlob",
      } as any,
      body: bodyBytes,
    });
    if (!putRes.ok) {
      const text = await putRes.text();
      return NextResponse.json(
        { error: `Blob upload failed: ${text}` },
        { status: 502 }
      );
    }

    // 4) Iniciar pipeline con la referencia al blob
    const startRes = await fetch(`https://${HOST}/api/process`, {
      method: "POST",
      headers: {
        "x-functions-key": KEY_START,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ container: "input", blobName }),
    });
    if (!startRes.ok) {
      const text = await startRes.text();
      return NextResponse.json(
        { error: `http_start failed: ${text}` },
        { status: 502 }
      );
    }
    const startJson = await startRes.json();
    const statusUrl = startJson?.statusQueryGetUri as string | undefined;
    if (!statusUrl) {
      return NextResponse.json(
        { error: "Missing statusQueryGetUri" },
        { status: 502 }
      );
    }

    // 5) Poll hasta Completed (o timeout)
    const t0 = Date.now();
    let output: any = null;
    while (true) {
      const statusRes = await fetch(statusUrl);
      if (!statusRes.ok) {
        const text = await statusRes.text();
        return NextResponse.json(
          { error: `status poll failed: ${text}` },
          { status: 502 }
        );
      }
      const statusJson = await statusRes.json();
      const st = statusJson?.runtimeStatus;
      if (st === "Completed") {
        output = statusJson?.output;
        break;
      }
      if (st === "Failed" || st === "Terminated") {
        return NextResponse.json(
          { error: `Pipeline ${st}`, detail: statusJson },
          { status: 500 }
        );
      }
      if (Date.now() - t0 > TIMEOUT_MS) {
        return NextResponse.json(
          { error: "Pipeline timeout", detail: statusJson },
          { status: 504 }
        );
      }
      await sleep(POLL_MS);
    }

    // 6) Leer blob final (SAS read) y devolver OCR
    const outBlob = output?.processedImageBlob?.blobName as string | undefined;
    const ocrResult = output?.ocrResult;
    if (!outBlob) {
      return NextResponse.json(
        { error: "Missing processedImageBlob in output", output },
        { status: 502 }
      );
    }

    const sasReadRes = await fetch(`https://${HOST}/api/sas`, {
      method: "POST",
      headers: {
        "x-functions-key": KEY_GET_SAS,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        container: "output",
        blobName: outBlob,
        mode: "read",
        minutes: 15,
      }),
    });
    if (!sasReadRes.ok) {
      const text = await sasReadRes.text();
      return NextResponse.json(
        { error: `get_sas(read) failed: ${text}` },
        { status: 502 }
      );
    }
    const readJson = await sasReadRes.json();
    const imageUrl = readJson?.sasUrl as string | undefined;
    if (!imageUrl) {
      return NextResponse.json(
        { error: "Missing sasUrl from get_sas(read)" },
        { status: 502 }
      );
    }

    // 7) Responder a tu cliente
    return NextResponse.json({
      imageUrl, // URL SAS temporal para ver/descargar la imagen final
      ocrResult, // JSON devuelto por el OCR
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
