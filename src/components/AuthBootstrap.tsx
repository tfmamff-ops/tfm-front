"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useAuthStore, clearPersistedAuth } from "@/lib/auth-store";
import { clearPersistedStore } from "@/lib/store";
import { sessionToRequestContext } from "@/lib/session-to-context";
import { FALLBACK_REQUEST_CONTEXT } from "@/lib/mock-request-context";
import { useAuthMode } from "@/components/AuthSessionProvider";

function AuthenticatedBootstrap() {
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

function MockBootstrap() {
  const setRequestContext = useAuthStore((s) => s.setRequestContext);
  const context = useMemo(() => {
    return {
      user: { ...FALLBACK_REQUEST_CONTEXT.user },
      client: {
        ...FALLBACK_REQUEST_CONTEXT.client,
        userAgent:
          typeof navigator === "undefined"
            ? FALLBACK_REQUEST_CONTEXT.client.userAgent
            : navigator.userAgent,
      },
    };
  }, []);

  useEffect(() => {
    setRequestContext(context);
  }, [context, setRequestContext]);

  return null;
}

/**
 * Bridges the authenticated NextAuth session into the internal requestContext store.
 * Also supports a mock request context when LOGIN_ENABLED is false.
 */
export default function AuthBootstrap() {
  const { loginEnabled } = useAuthMode();
  if (!loginEnabled) {
    return <MockBootstrap />;
  }
  return <AuthenticatedBootstrap />;
}
