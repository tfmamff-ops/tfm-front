// This API route ensures that /api/expected returns the same shape as json-server in development.
// It allows the frontend to consume expected batch/order/expiry data identically in both local and production (Netlify) environments.
//
// In development:
//   - If json-server is running and next.config.ts rewrites /api/expected, requests go to json-server.
//   - If json-server is NOT running, Next.js serves this API route as a fallback, so the frontend still works with mock data.
// In production (Netlify):
//   - This API route always serves the mock data from mocks/db.json.
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
