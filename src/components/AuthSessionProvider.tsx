"use client";

// --------------------------------------------------------------------------
// React hook and context provider to expose whether login is enabled.
// The root layout (server component) feeds the initial flag, then this
// provider refreshes it in the browser via /api/auth/config so useAuthMode()
// always returns the runtime value.
// --------------------------------------------------------------------------

import { SessionProvider } from "next-auth/react";
import {
  createContext,
  useContext,
  useMemo,
  PropsWithChildren,
  useState,
  useEffect,
} from "react";

type AuthModeContextValue = {
  loginEnabled: boolean;
};

// Default value if used outside the Provider (see layout.tsx)
const AuthModeContext = createContext<AuthModeContextValue>({
  loginEnabled: true,
});

// React hook that exposes the current login mode; callers must be inside AuthSessionProvider.
export function useAuthMode() {
  return useContext(AuthModeContext);
}

type AuthSessionProviderProps = PropsWithChildren<{
  initialLoginEnabled: boolean;
}>;

/**
 * Provides NextAuth session context to client components. When login is disabled,
 * it simply renders children and exposes the flag via context, ensuring the hook above
 * always reflects the runtime configuration (server-provided initial value plus the
 * runtime refresh performed below).
 */
export default function AuthSessionProvider({
  children,
  initialLoginEnabled,
}: AuthSessionProviderProps) {
  const [loginEnabled, setLoginEnabled] = useState(initialLoginEnabled);

  useEffect(() => {
    // Fetch real config from server (runtime)
    fetch("/api/auth/config")
      .then((res) => res.json())
      .then((data) => {
        setLoginEnabled(data.loginEnabled);
      })
      .catch((err) => console.error("Failed to fetch auth config", err));
  }, []);
  const value = useMemo<AuthModeContextValue>(
    () => ({ loginEnabled }),
    [loginEnabled]
  );

  const content = loginEnabled ? (
    <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>
  ) : (
    <>{children}</>
  );

  return (
    <AuthModeContext.Provider value={value}>{content}</AuthModeContext.Provider>
  );
}
