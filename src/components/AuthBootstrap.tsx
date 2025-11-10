"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useAuthStore, clearPersistedAuth } from "@/lib/auth-store";
import { clearPersistedStore } from "@/lib/store";
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
    // If user changed between sessions, wipe app store to start clean
    if (lastUserIdRef.current && lastUserIdRef.current !== session.user.id) {
      clearPersistedStore();
    }
    if (lastUserIdRef.current === session.user.id && requestContext) return;
    const ctx = sessionToRequestContext(session);
    if (ctx) {
      setRequestContext(ctx);
      lastUserIdRef.current = ctx.user.id;
    }
  }, [status, session, requestContext, setRequestContext]);

  // Clear local auth state if NextAuth reports the user is unauthenticated
  // (e.g., cookie expired, SSO closed elsewhere, manual signOut in other tab).
  useEffect(() => {
    if (status === "unauthenticated" && requestContext) {
      clearPersistedAuth();
      clearPersistedStore();
      lastUserIdRef.current = null;
    }
  }, [status, requestContext]);

  return null;
}
