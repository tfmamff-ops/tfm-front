import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

  try {
    // Absolute path to db.json file
    const filePath = path.join(process.cwd(), "mocks", "db.json");
    const data = await readFile(filePath, "utf-8");
    // If the file is an object, you can filter here if needed
    return NextResponse.json(JSON.parse(data));
  } catch (e) {
    // Log the error for debugging purposes
    console.error("Failed to read db.json:", e);
    return NextResponse.json(
      { error: "Failed to read db.json" },
      { status: 500 }
    );
  }
}
