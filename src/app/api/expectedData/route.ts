import { NextResponse } from "next/server";
import { getSasUrlForRead } from "@/server/azure";
import { parse } from "csv-parse/sync";
import { getSessionOrMock } from "@/server/auth-session";

const HOST = process.env.AZURE_FUNC_HOST!;
const KEY_GET_SAS = process.env.AZURE_FUNC_KEY_GET_SAS!;
const ERP_CONTAINER = process.env.ERP_CONTAINER!;
const BLOB_ERP_QUAD = process.env.BLOB_ERP_QUAD!;

export async function GET() {
  try {
    // Enforce authentication (middleware already does, but defense in depth)
    const session = await getSessionOrMock();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // 1. Get SAS URL for the CSV
    const sasUrl = await getSasUrlForRead({
      host: HOST,
      functionKey: KEY_GET_SAS,
      container: ERP_CONTAINER,
      blobName: BLOB_ERP_QUAD,
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

    // 4. Extract relevant columns with row number as id
    const prodCode = [];
    const prodDesc = [];
    const lot = [];
    const expDate = [];
    const packDate = [];
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + 2; // +2 because row 1 is header and array is 0-indexed
      prodCode.push({ id: rowNumber, value: row[1]?.trim() || "" });
      prodDesc.push({ id: rowNumber, value: row[2]?.trim() || "" });
      lot.push({ id: rowNumber, value: row[3]?.trim() || "" });
      expDate.push({ id: rowNumber, value: row[4]?.trim() || "" });
      packDate.push({ id: rowNumber, value: row[5]?.trim() || "" });
    }

    // 5. Return the expected shape
    return NextResponse.json({
      prodCode: prodCode,
      prodDesc: prodDesc,
      lot: lot,
      expDate: expDate,
      packDate: packDate,
    });
  } catch (e) {
    console.error("Error in /api/expectedData:", e);
    return NextResponse.json(
      { error: "No se pudo obtener expectedData" },
      { status: 500 }
    );
  }
}
