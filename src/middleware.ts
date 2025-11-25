import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLoginEnabled } from "@/config/auth";

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

  // --- 1. HANDLE LOGIN DISABLED GUARD ---

  const loginEnabled = isLoginEnabled();

  if (!loginEnabled) {
    // If login is disabled, and the user tries to access the /signin page, redirect to the root.
    if (pathname === "/signin") {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      const res = NextResponse.redirect(url);
      res.headers.set("X-Auth-Middleware", "redirect-root-auth-disabled");
      return res;
    }

    // If login is disabled, allow access to all other pages (they should not require authentication).
    return passThrough("auth-disabled");
  }

  // --- 2. HANDLE PUBLIC/UNPROTECTED ROUTES (WHEN LOGIN IS ENABLED) ---

  // Allow public/unprotected routes (like NextAuth API, static assets, etc.)
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/public/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    // Allow the /signin page itself to load if login IS enabled.
    pathname === "/signin"
  ) {
    return passThrough("public-pass");
  }

  // --- 3. HANDLE AUTHENTICATION REQUIREMENT (WHEN LOGIN IS ENABLED) ---

  // Detect session cookie names (standard + secure prefix variant)
  const sessionCookie =
    req.cookies.get("next-auth.session-token") ||
    req.cookies.get("__Secure-next-auth.session-token");

  if (!sessionCookie) {
    // If no session exists, redirect to /signin.
    const target = new URL("/signin", req.url);
    target.searchParams.set("callbackUrl", req.nextUrl.href);
    const res = NextResponse.redirect(target);
    res.headers.set("X-Auth-Middleware", "redirect-signin");
    return res;
  }

  // User is authenticated, allow access to protected routes.
  return passThrough("auth-pass");
}

// Apply middleware to all paths; filtering happens above.
export const config = {
  matcher: ["/:path*"],
};
