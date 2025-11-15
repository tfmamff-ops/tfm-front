"use client";

import { SessionProvider } from "next-auth/react";
import { createContext, useContext, useMemo, PropsWithChildren } from "react";

type AuthModeContextValue = {
  loginEnabled: boolean;
};

const AuthModeContext = createContext<AuthModeContextValue>({
  loginEnabled: true,
});

export function useAuthMode() {
  return useContext(AuthModeContext);
}

type AuthSessionProviderProps = PropsWithChildren<{
  loginEnabled: boolean;
}>;

/**
 * Provides NextAuth session context to client components. When login is disabled,
 * it simply renders children and exposes the flag via context.
 */
export default function AuthSessionProvider({
  children,
  loginEnabled,
}: AuthSessionProviderProps) {
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
