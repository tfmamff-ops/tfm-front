// This rewrite proxies /api/* requests to json-server (localhost:4000) during local development only.
// It allows the frontend to use mock API data from mocks/db.json via json-server.
// In production (e.g., Netlify), this rewrite has no effect and Next.js API routes are used instead.
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://localhost:4000/:path*" },
    ];
  },
};

export default nextConfig;
