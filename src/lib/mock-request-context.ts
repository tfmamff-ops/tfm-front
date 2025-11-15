import type { RequestContext } from "@/lib/auth-store";

export const FALLBACK_REQUEST_CONTEXT: RequestContext = {
  user: {
    id: "demo-operator",
    name: "Operador Demo",
    email: "demo.operator@rotulado.local",
    role: "qa_operator",
  },
  client: {
    appVersion: "web-1.0.0",
    ip: "127.0.0.1",
    userAgent: undefined,
  },
};
