import { NextResponse } from "next/server";
import { isLoginEnabled } from "@/config/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    loginEnabled: isLoginEnabled(),
  });
}
