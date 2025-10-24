import type { Expected } from "@/lib/store";
import type { RequestContext } from "@/lib/auth-store";

/**
 * Build FormData for the /api/azure-analyze endpoint.
 * - file: image to analyze
 * - expected: operator-provided expected values
 * - requestContext: optional user/client context
 */
export function buildAnalyzeFormData(
  file: File,
  expected: Expected,
  requestContext?: RequestContext
): FormData {
  const form = new FormData();
  form.append("file", file);

  // Normalize expected (avoid undefineds in JSON)
  const normalizedExpected: Expected = {
    ...(expected?.batch ? { batch: String(expected.batch).trim() } : {}),
    ...(expected?.order ? { order: String(expected.order).trim() } : {}),
    ...(expected?.expiry ? { expiry: String(expected.expiry).trim() } : {}),
  };

  try {
    form.append("expected", JSON.stringify(normalizedExpected));
  } catch {
    // If serialization fails, send empty object (backend should handle defaulting)
    form.append("expected", "{}");
  }

  if (requestContext) {
    try {
      form.append("requestContext", JSON.stringify(requestContext));
    } catch {
      // Ignore serialization issues; backend can treat it as absent
    }
  }

  return form;
}

/**
 * Optional: build a header with the RequestContext encoded in base64.
 * Useful if you prefer passing metadata in headers instead of form-data.
 */
export function buildRequestContextHeader(
  requestContext?: RequestContext
): Record<string, string> {
  if (!requestContext) return {};
  try {
    const json = JSON.stringify(requestContext);
    const hasWindow = (globalThis as any).window !== undefined;
    const b64 = hasWindow
      ? btoa(
          encodeURIComponent(json).replaceAll(
            /%([0-9A-F]{2})/g,
            (_, p1: string) => String.fromCodePoint(Number.parseInt(p1, 16))
          )
        )
      : Buffer.from(json, "utf-8").toString("base64");
    return { "X-Request-Context": b64 };
  } catch {
    return {};
  }
}
