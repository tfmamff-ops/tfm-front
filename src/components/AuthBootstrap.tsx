"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/lib/auth-store";
import { sessionToRequestContext } from "@/lib/session-to-context";

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
    if (status !== "authenticated" || !session?.user) return;
    if (lastUserIdRef.current === session.user.id && requestContext) return;
    const ctx = sessionToRequestContext(session);
    if (ctx) {
      setRequestContext(ctx);
      lastUserIdRef.current = ctx.user.id;
    }
  }, [status, session, requestContext, setRequestContext]);

  return null;
}
