import { getSessionOrMock } from "@/server/auth-session";
import { generateReport, getSasUrlForRead, SAS_MINUTES } from "@/server/azure";
import { NextRequest, NextResponse } from "next/server";

const HOST = process.env.AZURE_FUNC_HOST!;
const KEY_GENERATE_REPORT = process.env.AZURE_FUNC_KEY_GENERATE_REPORT!;
const KEY_GET_SAS = process.env.AZURE_FUNC_KEY_GET_SAS!;

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionOrMock();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { instanceId, comment, accepted } = body;
    if (!instanceId) {
      return NextResponse.json(
        { error: "Missing instanceId" },
        { status: 400 }
      );
    }

    // 1. Generate report via Azure Function
    const reportRes = await generateReport({
      host: HOST,
      functionKey: KEY_GENERATE_REPORT,
      instanceId,
      userComment: comment || "",
      accepted: !!accepted,
    });

    const { container, blobNamePDF } = reportRes.reportBlob;

    // 2. Get SAS URL for the generated PDF
    const sasUrl = await getSasUrlForRead({
      host: HOST,
      functionKey: KEY_GET_SAS,
      container,
      blobName: blobNamePDF,
      minutes: SAS_MINUTES,
    });

    return NextResponse.json({ url: sasUrl });
  } catch (e: unknown) {
    console.error("Report generation error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Report generation failed" },
      { status: 500 }
    );
  }
}
