import { NextResponse } from "next/server";
import { getSasUrlForRead } from "@/server/azure";
import { parse } from "csv-parse/sync";

const HOST = process.env.AZURE_FUNC_HOST!;
const KEY_GET_SAS = process.env.AZURE_FUNC_KEY_GET_SAS!;
const CONTAINER = "erp";
const BLOB_NAME = "ERP_QAD_export.csv";

export async function GET() {
  try {
    // 1. Get SAS URL for the CSV
    const sasUrl = await getSasUrlForRead({
      host: HOST,
      functionKey: KEY_GET_SAS,
      container: CONTAINER,
      blobName: BLOB_NAME,
      minutes: 10,
    });

    // 2. Download the CSV
    const res = await fetch(sasUrl);
    if (!res.ok) throw new Error("No se pudo descargar el CSV");
    const csvText = await res.text();

    // 3. Parse the CSV (using csv-parse/sync)
    const records = parse(csvText, { skip_empty_lines: true });
    // Skip the first row (headers)
    const dataRows = records.slice(1);

    // 4. Extract relevant columns
    const item = [];
    const itemDesc = [];
    const batch = [];
    const expiry = [];
    const order = [];
    for (const row of dataRows) {
      item.push(row[1]?.trim() || "");
      itemDesc.push(row[2]?.trim() || "");
      batch.push(row[3]?.trim() || "");
      expiry.push(row[4]?.trim() || "");
      order.push(row[5]?.trim() || "");
    }

    // 5. Return the expected shape
    return NextResponse.json({ item, itemDesc, batch, expiry, order });
  } catch (e) {
    console.error("Error in /api/expected:", e);
    return NextResponse.json(
      { error: "No se pudo obtener expectedData" },
      { status: 500 }
    );
  }
}
