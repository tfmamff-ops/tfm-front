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
    };
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    jobTitle?: string | null;
  }
}
