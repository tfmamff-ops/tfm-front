"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";

/**
 * Initializes a dummy requestContext when none exists yet.
 * This is a temporary bootstrap while login is not implemented.
 * It runs only on the client and sets a single time per session.
 */
export default function AuthBootstrap() {
  const requestContext = useAuthStore((s) => s.requestContext);
  const setRequestContext = useAuthStore((s) => s.setRequestContext);

  useEffect(() => {
    if (!requestContext) {
      const ua =
        typeof navigator === "undefined" ? undefined : navigator.userAgent;
      setRequestContext({
        user: {
          id: "local|anonymous",
          name: "Operador",
          email: "anonymous@local",
          role: "qa_operator",
        },
        client: {
          appVersion: "web",
          ip: "127.0.0.1",
          userAgent: ua,
        },
      });
    }
  }, [requestContext, setRequestContext]);

  return null;
}
