import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isLoginEnabled } from "@/config/auth";
import { FALLBACK_REQUEST_CONTEXT } from "@/lib/mock-request-context";

export async function getSessionOrMock(): Promise<Session | null> {
  if (!isLoginEnabled()) {
    return {
      user: {
        id: FALLBACK_REQUEST_CONTEXT.user.id,
        name: FALLBACK_REQUEST_CONTEXT.user.name,
        email: FALLBACK_REQUEST_CONTEXT.user.email,
        role: FALLBACK_REQUEST_CONTEXT.user.role ?? "qa_operator",
        ip: FALLBACK_REQUEST_CONTEXT.client.ip,
      },
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    } satisfies Session;
  }

  return getServerSession(authOptions);
}
