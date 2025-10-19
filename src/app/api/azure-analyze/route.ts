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
    // Read file from form-data
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const contentType = file.type || "application/octet-stream";
    const arrayBuf = await file.arrayBuffer();

    // Request upload SAS (input/uploads/<uuid>.<ext>)
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

    // Upload the file to the SAS URL (PUT)
    try {
      await uploadBlobToSasUrl(sasUrl, arrayBuf);
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message || String(e) },
        { status: 502 }
      );
    }

    // Start the pipeline with the blob reference and expected data
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

    // Poll until Completed (or timeout)
    let output: any;
    try {
      output = await pollPipeline(statusUrl, TIMEOUT_MS, POLL_MS);
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message || String(e) },
        { status: 502 }
      );
    }

    // Read final blob (SAS read)
    const outBlob = output?.processedImageBlob?.blobName as string | undefined;
    if (!outBlob) {
      return NextResponse.json(
        { error: "Missing processedImageBlob in output", output },
        { status: 502 }
      );
    }

    // Read final overlay ocr blob (SAS read)
    const outOverlayBlob = output?.ocrOverlayBlob?.blobName as
      | string
      | undefined;

    // Get SAS URLs for the final blobs
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

    let ocrOverlayImageUrl: string | undefined;
    if (outOverlayBlob) {
      try {
        ocrOverlayImageUrl = await getSasUrlForRead({
          host: HOST,
          functionKey: KEY_GET_SAS,
          container: "output",
          blobName: outOverlayBlob,
          minutes: 15,
        });
      } catch (e) {
        console.warn("Failed to fetch ocrOverlayImageUrl:", e);
      }
    }

    // Read OCR result
    const ocrResult = output?.ocrResult;

    // Read barcode overlay image and ROI image
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

    // Read other barcode info
    const barcodeData = output?.barcode?.barcodeData;

    // Read other validation info
    const validationData = output?.validation;

    const jsonResp = {
      imageUrl, // temporary SAS URL to view/download the final image
      ocrOverlayImageUrl, // temporary SAS URL to view/download the OCR overlay image
      barcodeOverlayImageUrl, // temporary SAS URL to view/download the barcode overlay image
      barcodeRoiImageUrl, // temporary SAS URL to view/download the barcode ROI image
      ocrResult, // JSON returned by OCR
      barcodeData, // JSON returned by barcode analysis
      validationData, // JSON returned by validation
    };

    console.log("Pipeline output:", jsonResp);

    // Respond to the client
    return NextResponse.json(jsonResp);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
