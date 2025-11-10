// src/types/next-auth.d.ts
// Remove unused concrete import to avoid lint warning; module augmentation does not require it.
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: string;
      ip?: string; // Anonymized client IP (a.b.c.xxx for IPv4)
    };
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    jobTitle?: string | null;
    clientIp?: string; // Anonymized client IP stored in token
  }
}
