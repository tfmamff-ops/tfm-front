"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/lib/auth-store";

/**
 * Bridges the authenticated NextAuth session into the internal requestContext store.
 * Removes temporary dummy user bootstrap. Only runs client-side.
 */
export default function AuthBootstrap() {
  const { data: session, status } = useSession();
  const requestContext = useAuthStore((s) => s.requestContext);
  const setRequestContext = useAuthStore((s) => s.setRequestContext);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) {
      return;
    }

    // Avoid redundant store writes if same user
    if (lastUserIdRef.current === session.user.id && requestContext) {
      return;
    }

    const ua =
      typeof navigator === "undefined" ? undefined : navigator.userAgent;

    setRequestContext({
      user: {
        id: session.user.id,
        name: session.user.name || "",
        email: session.user.email || "",
        role: session.user.role, // Already normalized in NextAuth callbacks
      },
      client: {
        appVersion: "web-1.0.0",
        ip: "127.0.0.1", // You can later replace with server-provided IP if needed
        userAgent: ua,
      },
    });

    lastUserIdRef.current = session.user.id;
  }, [status, session, requestContext, setRequestContext]);

  return null;
}
