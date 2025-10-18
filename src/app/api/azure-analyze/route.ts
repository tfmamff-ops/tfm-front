import {
  getSasUrlForRead,
  getSasUrlForUpload,
  pollPipeline,
  startPipeline,
  uploadBlobToSasUrl,
} from "@/server/azure";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import type { Expected } from "@/lib/store";

const HOST = process.env.AZURE_FUNC_HOST!;
const KEY_GET_SAS = process.env.AZURE_FUNC_KEY_GET_SAS!;
const KEY_START = process.env.AZURE_FUNC_KEY_HTTP_START!;
const TIMEOUT_MS = Number(process.env.AZURE_PIPELINE_TIMEOUT_MS ?? 90000);
const POLL_MS = Number(process.env.AZURE_PIPELINE_POLL_MS ?? 2000);

function parseExpectedFromForm(form: FormData): Expected | undefined {
  try {
    const expectedRaw = form.get("expected");
    if (typeof expectedRaw === "string" && expectedRaw.trim().length > 0) {
      return JSON.parse(expectedRaw) as Expected;
    }
  } catch (e) {
    console.warn("Failed to parse expected from form-data:", e);
  }
  return undefined;
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

    // 2) Pedir SAS de upload (input/uploads/<uuid>.<ext>)
    const ext = file.name.includes(".")
      ? file.name.substring(file.name.lastIndexOf("."))
      : "";
    const blobName = `uploads/${randomUUID()}${ext}`;

    let sasUrl: string;
    try {
      sasUrl = await getSasUrlForUpload({
        host: HOST,
        functionKey: KEY_GET_SAS,
        container: "input",
        blobName,
        minutes: 15,
        contentType,
      });
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message || String(e) },
        { status: 502 }
      );
    }

    // 3) Subir el archivo al SAS URL (PUT)
    try {
      await uploadBlobToSasUrl(sasUrl, arrayBuf);
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message || String(e) },
        { status: 502 }
      );
    }

    // 4) Iniciar pipeline con la referencia al blob (+ expected opcional)
    const expectedParsed = parseExpectedFromForm(form);
    if (expectedParsed === undefined) {
      return NextResponse.json(
        { error: "Missing expected payload" },
        { status: 400 }
      );
    }
    let statusUrl: string;
    try {
      statusUrl = await startPipeline({
        host: HOST,
        functionKey: KEY_START,
        container: "input",
        blobName,
        expectedData: expectedParsed,
      });
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message || String(e) },
        { status: 502 }
      );
    }

    // 5) Poll hasta Completed (o timeout)
    let output: any;
    try {
      output = await pollPipeline(statusUrl, TIMEOUT_MS, POLL_MS);
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message || String(e) },
        { status: 502 }
      );
    }

    // 6) Leer blob final (SAS read)
    const outBlob = output?.processedImageBlob?.blobName as string | undefined;
    if (!outBlob) {
      return NextResponse.json(
        { error: "Missing processedImageBlob in output", output },
        { status: 502 }
      );
    }

    let imageUrl: string;
    try {
      imageUrl = await getSasUrlForRead({
        host: HOST,
        functionKey: KEY_GET_SAS,
        container: "output",
        blobName: outBlob,
        minutes: 15,
      });
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message || String(e) },
        { status: 502 }
      );
    }

    // 7) Leer OCR
    const ocrResult = output?.ocrResult;

    let barcodeOverlayImageUrl: string | undefined;
    let barcodeRoiImageUrl: string | undefined;
    if (output?.barcode?.barcodeData?.barcodeDetected) {
      try {
        barcodeOverlayImageUrl = await getSasUrlForRead({
          host: HOST,
          functionKey: KEY_GET_SAS,
          container: "output",
          blobName: output?.barcode?.barcodeOverlayBlob?.blobName,
          minutes: 15,
        });
      } catch (e) {
        console.warn("Failed to fetch barcodeOverlayImageUrl:", e);
      }
      try {
        barcodeRoiImageUrl = await getSasUrlForRead({
          host: HOST,
          functionKey: KEY_GET_SAS,
          container: "output",
          blobName: output?.barcode?.barcodeRoiBlob?.blobName,
          minutes: 15,
        });
      } catch (e) {
        console.warn("Failed to fetch barcodeRoiImageUrl:", e);
      }
    }

    // 9) Leer resto de información de bardcode
    const barcodeData = output?.barcode?.barcodeData;

    const jsonResp = {
      imageUrl, // URL SAS temporal para ver/descargar la imagen final
      barcodeOverlayImageUrl, // URL SAS temporal para ver/descargar la imagen con overlay de barcode
      barcodeRoiImageUrl, // URL SAS temporal para ver/descargar la imagen con ROI de barcode
      ocrResult, // JSON devuelto por el OCR
      barcodeData, // JSON devuelto por el análisis de barcode
    };

    console.log("Pipeline output:", jsonResp);

    // 7) Responder a tu cliente
    return NextResponse.json(jsonResp);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
