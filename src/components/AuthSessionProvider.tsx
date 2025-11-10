"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

/**
 * Provides NextAuth session context to client components.
 * Wrap this around any subtree that uses useSession().
 */
export default function AuthSessionProvider({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>
  );
}
