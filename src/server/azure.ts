// Server-only helpers for Azure Function interactions
import { RequestContextUser } from "@/lib/auth-store";
import type { ExpectedData } from "@/lib/store";

export const SAS_MINUTES = 15;

export async function getSasUrlForRead(params: {
  host: string;
  functionKey: string;
  container: string;
  blobName: string;
  minutes?: number;
}): Promise<string> {
  const { host, functionKey, container, blobName, minutes } = params;

  const res = await fetch(`https://${host}/api/sas`, {
    method: "POST",
    headers: {
      "x-functions-key": functionKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ container, blobName, mode: "read", minutes }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`get_sas(read) failed: ${text}`);
  }

  const json = (await res.json()) as { sasUrl?: string };
  if (!json?.sasUrl) {
    throw new Error("Missing sasUrl from get_sas(read)");
  }
  return json.sasUrl;
}

export async function getSasUrlForUpload(params: {
  host: string;
  functionKey: string;
  container: string;
  blobName: string;
  minutes?: number;
  contentType?: string;
}): Promise<string> {
  const { host, functionKey, container, blobName, minutes, contentType } =
    params;
  const payload: Record<string, unknown> = {
    container,
    blobName,
    mode: "upload",
    minutes,
  };
  if (contentType) payload.contentType = contentType;

  const res = await fetch(`https://${host}/api/sas`, {
    method: "POST",
    headers: {
      "x-functions-key": functionKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`get_sas(upload) failed: ${text}`);
  }
  const json = (await res.json()) as { sasUrl?: string };
  if (!json?.sasUrl) throw new Error("Missing sasUrl from get_sas(upload)");
  return json.sasUrl;
}

export async function uploadBlobToSasUrl(
  sasUrl: string,
  body: BodyInit
): Promise<void> {
  const res = await fetch(sasUrl, {
    method: "PUT",
    headers: { "x-ms-blob-type": "BlockBlob" } as Record<string, string>,
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Blob upload failed: ${text}`);
  }
}

export async function startPipeline(params: {
  host: string;
  functionKey: string;
  container: string;
  blobName: string;
  expectedData: ExpectedData;
  requestContext: RequestContextUser;
}): Promise<string> {
  const {
    host,
    functionKey,
    container,
    blobName,
    expectedData,
    requestContext,
  } = params;
  const payload = {
    container,
    blobName,
    expectedData,
    requestContext,
  } as const;

  console.log("Starting pipeline with payload:", payload);

  const res = await fetch(`https://${host}/api/process`, {
    method: "POST",
    headers: {
      "x-functions-key": functionKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`http_start failed: ${text}`);
  }
  const json = await res.json();
  const statusUrl = json?.statusQueryGetUri as string | undefined;
  if (!statusUrl) throw new Error("Missing statusQueryGetUri");
  console.log("Pipeline started, status URL:", statusUrl);
  return statusUrl;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function pollPipeline(
  statusUrl: string,
  timeoutMs: number,
  pollMs: number
) {
  const t0 = Date.now();
  while (true) {
    const statusRes = await fetch(statusUrl);
    if (!statusRes.ok) {
      const text = await statusRes.text();
      throw new Error(`status poll failed: ${text}`);
    }
    const outputJson = await statusRes.json();
    const st = outputJson?.runtimeStatus;
    if (st === "Completed") return outputJson;
    if (st === "Failed" || st === "Terminated") {
      throw new Error(`Pipeline ${st}`);
    }
    if (Date.now() - t0 > timeoutMs) {
      throw new Error("Pipeline timeout");
    }
    await sleep(pollMs);
  }
}

export async function generateReport(params: {
  host: string;
  functionKey: string;
  instanceId: string;
  userComment: string;
  accepted: boolean;
}): Promise<{
  reportBlob: { container: string; blobNamePDF: string; blobNameDOCX: string };
}> {
  const { host, functionKey, instanceId, userComment, accepted } = params;

  const res = await fetch(`https://${host}/api/generate-report`, {
    method: "POST",
    headers: {
      "x-functions-key": functionKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ instanceId, userComment, accepted }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`generateReport failed: ${text}`);
  }

  return res.json();
}
