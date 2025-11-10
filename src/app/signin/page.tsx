"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";

/**
 * Auto sign-in page that immediately triggers Azure AD B2C login.
 * Keeps a manual fallback button in case auto redirect fails.
 */
export default function SignInPage() {
  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);

  useEffect(() => {
    // Prevent multiple triggers (React Strict Mode double invoke in dev)
    if (startedRef.current) return;
    startedRef.current = true;

    const timer = setTimeout(() => {
      // Show manual fallback if we haven't navigated away in ~3s
      setManualMode(true);
    }, 3000);

    signIn("azure-ad-b2c").catch((e) => {
      console.error("Auto sign-in failed", e);
      setError("Auto sign-in failed. Please use the button below.");
      setManualMode(true);
    });

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Iniciando sesión…
        </h1>
        <p className="text-sm text-muted-foreground">
          Redirigiendo al proveedor de identidad de la organización.
        </p>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {manualMode && (
          <div className="space-y-3">
            <button
              onClick={() => signIn("azure-ad-b2c")}
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              Ingresar manualmente
            </button>
            <p className="text-xs text-muted-foreground">
              Si no ocurre nada, haz clic en el botón para iniciar sesión.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
