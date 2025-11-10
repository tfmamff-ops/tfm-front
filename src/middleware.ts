// Extremely simplified auth gate: if user lacks a NextAuth session cookie,
// redirect to /signin. Adds an X-Auth-Middleware header for manual debugging.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Extract client IP from common headers or req.ip (platform dependent)
  const fwd = req.headers.get("x-forwarded-for");
  const real = req.headers.get("x-real-ip");
  const vercel = req.headers.get("x-vercel-forwarded-for");
  const clientIp =
    (fwd ? fwd.split(",")[0].trim() : undefined) ||
    real ||
    vercel ||
    (req as unknown as { ip?: string }).ip ||
    undefined;

  // Helper to forward request headers downstream (so handlers can read x-client-ip)
  const passThrough = (tag: string) => {
    const headers = new Headers(req.headers);
    if (clientIp) headers.set("x-client-ip", clientIp);
    // Also set a cookie so auth callbacks can read it reliably
    const res = NextResponse.next({ request: { headers } });
    if (clientIp) {
      res.cookies.set("client-ip", clientIp, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });
    }
    res.headers.set("X-Auth-Middleware", tag);
    return res;
  };

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
    return passThrough("public-pass");
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

  return passThrough("auth-pass");
}

// Apply middleware to all paths; filtering happens above.
export const config = {
  matcher: ["/:path*"],
};
