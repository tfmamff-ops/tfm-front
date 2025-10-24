import { create } from "zustand";
import { persist, createJSONStorage, devtools } from "zustand/middleware";

// ============================================================================
// TYPES
// ============================================================================

/** Logged-in user and client context to send to backend APIs */
export type RequestContextUser = {
  /** Stable unique ID from auth provider or local auth system */
  id: string;
  /** User's full name for audit/log display */
  name: string;
  /** Optional email for audit/log display */
  email?: string;
  /** Functional role (admin, auditor, operator, etc.) */
  role?: string;
};

export type RequestContextClient = {
  /** Frontend or mobile app version */
  appVersion?: string;
  /** Public IP as seen by backend API */
  ip?: string;
  /** Browser or device info */
  userAgent?: string;
};

export type RequestContext = {
  user: RequestContextUser;
  client: RequestContextClient;
};

/** Auth-specific store */
export type AuthState = {
  /** Logged-in user and client context (set after login) */
  requestContext?: RequestContext;

  // Actions
  setRequestContext: (ctx?: RequestContext) => void;
  setRequestUser: (patch: Partial<RequestContextUser>) => void;
  setRequestClient: (patch: Partial<RequestContextClient>) => void;
  clearRequestContext: () => void;
};

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const isDev = process.env.NODE_ENV !== "production";

/** SSR-safe storage: return sessionStorage in browser, otherwise a noop storage */
const getStorage = (): Storage => {
  const w = (globalThis as unknown as { window?: Window }).window;
  if (w?.sessionStorage) {
    return w.sessionStorage;
  }
  // Noop storage for server-side where sessionStorage is not available
  return {
    length: 0,
    clear: () => {},
    getItem: () => null,
    key: () => null,
    removeItem: () => {},
    setItem: () => {},
  };
};

// ============================================================================
// STORE
// ============================================================================

/** Auth store (no "use client" here) */
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        requestContext: undefined,

        setRequestContext: (ctx) =>
          set({ requestContext: ctx }, false, "setRequestContext"),

        setRequestUser: (patch) =>
          set(
            (s) =>
              s.requestContext
                ? {
                    requestContext: {
                      ...s.requestContext,
                      user: { ...s.requestContext.user, ...patch },
                    },
                  }
                : {},
            false,
            "setRequestUser"
          ),

        setRequestClient: (patch) =>
          set(
            (s) =>
              s.requestContext
                ? {
                    requestContext: {
                      ...s.requestContext,
                      client: { ...s.requestContext.client, ...patch },
                    },
                  }
                : {},
            false,
            "setRequestClient"
          ),

        clearRequestContext: () =>
          set({ requestContext: undefined }, false, "clearRequestContext"),
      }),
      {
        name: "tfm-auth-store",
        storage: createJSONStorage(() => getStorage()),
        partialize: (s) => ({ requestContext: s.requestContext }),
      }
    ),
    {
      name: "TFM Auth Store",
      enabled: isDev,
      ...(isDev && { trace: true, traceLimit: 25 }),
    }
  )
);

// ============================================================================
// HELPERS
// ============================================================================

/** Optional helper to clear persisted auth data */
export const clearPersistedAuth = () => {
  useAuthStore.persist.clearStorage();
  useAuthStore.setState({ requestContext: undefined });
};
