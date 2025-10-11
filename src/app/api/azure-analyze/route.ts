// /app/api/azure-analyze/route.ts
import { NextRequest } from "next/server";

const AZURE_ENDPOINT = process.env.AZURE_CV_ENDPOINT!; // e.g. https://xxx.cognitiveservices.azure.com
const AZURE_KEY = process.env.AZURE_CV_KEY!; // your key

const AZURE_PATH =
  "/computervision/imageanalysis:analyze?features=read&model-version=latest&language=en&api-version=2024-02-01";

export async function POST(req: NextRequest) {
  try {
    // Accepts FormData with 'file' or JSON with { url }
    const contentType = req.headers.get("content-type") || "";

    let azureRes: Response;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      if (!file) {
        return new Response(JSON.stringify({ error: "Missing file" }), {
          status: 400,
        });
      }

      azureRes = await fetch(`${AZURE_ENDPOINT}${AZURE_PATH}`, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": AZURE_KEY,
          "Content-Type": "application/octet-stream",
        },
        body: file, // the File is already binary
      });
    } else {
      const body = await req.json().catch(() => ({}));
      if (!body?.url) {
        return new Response(JSON.stringify({ error: "Missing url" }), {
          status: 400,
        });
      }

      azureRes = await fetch(`${AZURE_ENDPOINT}${AZURE_PATH}`, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": AZURE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: body.url }),
      });
    }

    if (!azureRes.ok) {
      const text = await azureRes.text();
      return new Response(
        JSON.stringify({ error: text || azureRes.statusText }),
        {
          status: azureRes.status,
        }
      );
    }

    const data = await azureRes.json();
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message || "Unexpected error" }),
      { status: 500 }
    );
  }
}
