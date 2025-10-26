import type { ExpectedData } from "@/lib/store";
import type { RequestContext } from "@/lib/auth-store";

/**
 * Build FormData for the /api/azure-analyze endpoint.
 * - file: image to analyze
 * - expected: operator-provided expected values
 * - requestContext: optional user/client context
 */
export function buildAnalyzeFormData(
  file: File,
  expectedData: ExpectedData,
  requestContext?: RequestContext
): FormData {
  const form = new FormData();
  form.append("file", file);

  try {
    form.append("expectedData", JSON.stringify(expectedData));
  } catch {
    // If serialization fails, send empty object (backend should handle defaulting)
    form.append("expectedData", "{}");
  }

  if (requestContext) {
    try {
      form.append("requestContext", JSON.stringify(requestContext));
    } catch {
      // If serialization fails, send empty object (backend should handle defaulting)
      form.append("requestContext", "{}");
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
    // SSR-safe check without using `any` and preferring globalThis.window
    const hasWindow =
      typeof globalThis !== "undefined" &&
      (globalThis as { window?: unknown }).window !== undefined;
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
