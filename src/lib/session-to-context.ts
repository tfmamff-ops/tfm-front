// Helper to convert a NextAuth session into RequestContext shape used by the app.
// Keeps a single source of truth for mapping and normalization.
import type { Session } from "next-auth";
import type { RequestContext } from "@/lib/auth-store";

export function sessionToRequestContext(
  session: Session
): RequestContext | undefined {
  if (!session.user?.id) return undefined;
  return {
    user: {
      id: session.user.id,
      name: session.user.name || "",
      email: session.user.email || undefined,
      role: session.user.role,
    },
    client: {
      appVersion: "web-1.0.0",
      userAgent:
        typeof navigator === "undefined" ? undefined : navigator.userAgent,
    },
  };
}
