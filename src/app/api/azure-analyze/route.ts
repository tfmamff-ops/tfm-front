// Next.js API route for image analysis via Azure Functions.
// Handles file upload to Azure Blob Storage, orchestrates the OCR/barcode/validation pipeline,
// polls for completion, and returns temporary SAS (Shared Access Signature) URLs for processed images and analysis results.

import {
  getSasUrlForRead,
  getSasUrlForUpload,
  pollPipeline,
  startPipeline,
  uploadBlobToSasUrl,
} from "@/server/azure";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { randomUUID } from "node:crypto";
import type { ExpectedData } from "@/lib/store";
import { RequestContextUser } from "@/lib/auth-store";

const HOST = process.env.AZURE_FUNC_HOST!;
const KEY_GET_SAS = process.env.AZURE_FUNC_KEY_GET_SAS!;
const KEY_START = process.env.AZURE_FUNC_KEY_HTTP_START!;
const TIMEOUT_MS = Number(process.env.AZURE_PIPELINE_TIMEOUT_MS ?? 90000);
const POLL_MS = Number(process.env.AZURE_PIPELINE_POLL_MS ?? 2000);

// Minimal structure we rely on from the pipeline output
type PipelineOutput = {
  processedImageBlob?: { blobName?: string };
  ocrOverlayBlob?: { blobName?: string };
  ocrResult?: unknown;
  barcode?: {
    barcodeData?: { barcodeDetected?: boolean };
    barcodeOverlayBlob?: { blobName?: string };
    barcodeRoiBlob?: { blobName?: string };
  };
  validation?: unknown;
};

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function toMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function parseExpectedDataFromForm(form: FormData): ExpectedData | undefined {
  try {
    const expectedRaw = form.get("expectedData");
    if (typeof expectedRaw === "string" && expectedRaw.trim().length > 0) {
      return JSON.parse(expectedRaw) as ExpectedData;
    }
  } catch (e) {
    console.warn("Failed to parse expected data from form-data:", e);
  }
  return undefined;
}

function parseRequestContextFromForm(
  form: FormData
): RequestContextUser | undefined {
  try {
    const contextRaw = form.get("requestContext");
    if (typeof contextRaw === "string" && contextRaw.trim().length > 0) {
      return JSON.parse(contextRaw);
    }
  } catch (e) {
    console.warn("Failed to parse request context from form-data:", e);
  }
  return undefined;
}

async function getUploadSasOrFail(params: {
  host: string;
  functionKey: string;
  container: string;
  blobName: string;
  minutes: number;
  contentType: string;
}): Promise<string> {
  try {
    return await getSasUrlForUpload(params);
  } catch (e) {
    throw new HttpError(502, toMessage(e));
  }
}

async function uploadToSasOrFail(
  sasUrl: string,
  arrayBuf: ArrayBuffer
): Promise<void> {
  try {
    await uploadBlobToSasUrl(sasUrl, arrayBuf);
  } catch (e) {
    throw new HttpError(502, toMessage(e));
  }
}

async function startPipelineOrFail(params: {
  host: string;
  functionKey: string;
  container: string;
  blobName: string;
  expectedData: ExpectedData;
  requestContext: RequestContextUser;
}): Promise<string> {
  try {
    return await startPipeline(params);
  } catch (e) {
    throw new HttpError(502, toMessage(e));
  }
}

async function pollPipelineOrFail(
  statusUrl: string,
  timeoutMs: number,
  pollMs: number
): Promise<PipelineOutput> {
  try {
    return (await pollPipeline(statusUrl, timeoutMs, pollMs)) as PipelineOutput;
  } catch (e) {
    throw new HttpError(502, toMessage(e));
  }
}

async function getReadSasOrFail(blobName: string): Promise<string> {
  try {
    return await getSasUrlForRead({
      host: HOST,
      functionKey: KEY_GET_SAS,
      container: "output",
      blobName,
      minutes: 15,
    });
  } catch (e) {
    throw new HttpError(502, toMessage(e));
  }
}

async function getReadSasOrWarn(
  blobName?: string
): Promise<string | undefined> {
  if (!blobName) return undefined;
  try {
    return await getSasUrlForRead({
      host: HOST,
      functionKey: KEY_GET_SAS,
      container: "output",
      blobName,
      minutes: 15,
    });
  } catch (e) {
    console.warn("Failed to fetch read SAS:", e);
    return undefined;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Enforce authentication server-side (defense in depth)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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

    const sasUrl = await getUploadSasOrFail({
      host: HOST,
      functionKey: KEY_GET_SAS,
      container: "input",
      blobName,
      minutes: 15,
      contentType,
    });

    // Upload the file to the SAS URL (PUT)
    await uploadToSasOrFail(sasUrl, arrayBuf);

    // Start the pipeline with the blob reference, expected data and request context
    const expectedDataParsed = parseExpectedDataFromForm(form);
    const requestContextParsed = parseRequestContextFromForm(form);
    if (expectedDataParsed === undefined) {
      return NextResponse.json(
        { error: "Missing expected data payload" },
        { status: 400 }
      );
    }
    // Prefer authenticated session's user context if present
    const effectiveRequestContext = requestContextParsed || {
      id: session.user.id,
      name: session.user.name || "",
      email: session.user.email || undefined,
      role: session.user.role,
    };
    const statusUrl = await startPipelineOrFail({
      host: HOST,
      functionKey: KEY_START,
      container: "input",
      blobName,
      expectedData: expectedDataParsed,
      requestContext: effectiveRequestContext,
    });

    // Poll until Completed (or timeout)
    const output = await pollPipelineOrFail(statusUrl, TIMEOUT_MS, POLL_MS);

    // Read final blob (SAS read)
    const outBlob = output?.processedImageBlob?.blobName;
    if (!outBlob) {
      return NextResponse.json(
        { error: "Missing processedImageBlob in output", output },
        { status: 502 }
      );
    }

    // Read final overlay ocr blob (SAS read)
    const outOverlayBlob = output?.ocrOverlayBlob?.blobName;

    // Get SAS URLs for the final blobs
    const imageUrl = await getReadSasOrFail(outBlob);

    const ocrOverlayImageUrl = await getReadSasOrWarn(outOverlayBlob);

    // Read OCR result
    const ocrResult = output?.ocrResult;

    // Read barcode overlay image and ROI image
    let barcodeOverlayImageUrl: string | undefined;
    let barcodeRoiImageUrl: string | undefined;
    if (output?.barcode?.barcodeData?.barcodeDetected) {
      barcodeOverlayImageUrl = await getReadSasOrWarn(
        output?.barcode?.barcodeOverlayBlob?.blobName
      );
      barcodeRoiImageUrl = await getReadSasOrWarn(
        output?.barcode?.barcodeRoiBlob?.blobName
      );
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
  } catch (e: unknown) {
    console.error(e);
    if (e instanceof HttpError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json(
      { error: toMessage(e) ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
