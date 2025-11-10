// Extremely simplified auth gate: if user lacks a NextAuth session cookie,
// redirect to /signin. Adds an X-Auth-Middleware header for manual debugging.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public/unprotected routes
  if (
    pathname === "/signin" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/public/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg")
  ) {
    const res = NextResponse.next();
    res.headers.set("X-Auth-Middleware", "public-pass");
    return res;
  }

  // Detect session cookie names (standard + secure prefix variant)
  const sessionCookie =
    req.cookies.get("next-auth.session-token") ||
    req.cookies.get("__Secure-next-auth.session-token");

  if (!sessionCookie) {
    const target = new URL("/signin", req.url);
    target.searchParams.set("callbackUrl", req.nextUrl.href);
    const res = NextResponse.redirect(target);
    res.headers.set("X-Auth-Middleware", "redirect-signin");
    return res;
  }

  const res = NextResponse.next();
  res.headers.set("X-Auth-Middleware", "auth-pass");
  return res;
}

// Apply middleware to all paths; filtering happens above.
export const config = {
  matcher: ["/:path*"],
};
