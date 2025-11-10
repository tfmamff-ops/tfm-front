// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Protect almost everything by default.
// - Allow NextAuth endpoints
// - Allow Next.js internals and static files
// - Allow the explicit sign-in page (it triggers the OAuth flow)
export default withAuth(
  function middleware(req) {
    // You can add extra logic here if needed (e.g., block by role)
    return NextResponse.next();
  },
  {
    callbacks: {
      // If no token (not authenticated), redirect to /signin
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/signin",
    },
  }
);

// Configure which paths the middleware runs on.
// This matcher runs on everything except:
// - files in _next/static, _next/image, favicon, assets
// - NextAuth API routes (they must be accessible)
// - public files (adjust if you need to protect some)
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api auth routes: /api/auth/*
     * - static files: _next/static, _next/image
     * - favicon and assets: favicon.ico, robots.txt, images, etc.
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images/|public/).*)",
  ],
};
