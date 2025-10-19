export async function GET() {
  try {
    // Absolute path to db.json file
    const filePath = path.join(process.cwd(), "mocks", "db.json");
    const data = await readFile(filePath, "utf-8");
    // Return the same shape as json-server: { batch, order, expiry }
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === "object" && parsed.expected) {
      return NextResponse.json(parsed.expected);
    }
    return NextResponse.json(parsed);
  } catch (e) {
    // Log the error for debugging purposes
    console.error("Failed to read db.json:", e);
    return NextResponse.json(
      { error: "Failed to read db.json" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
