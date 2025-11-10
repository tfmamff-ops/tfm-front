"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
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

    // Auto sign-in. Add prompt=login only if returning from explicit logout? Here only for non-manual.
    signIn("azure-ad-b2c", { callbackUrl: "/" }).catch((e) => {
      console.error("Auto sign-in failed", e);
      setError("Auto sign-in failed. Please use the button below.");
      setManualMode(true);
    });

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative isolate min-h-[60vh] flex flex-col items-center justify-center py-16">
      {/* Decorative background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-emerald-100 via-white to-emerald-50 dark:from-emerald-950 dark:via-neutral-950 dark:to-emerald-900"
      />
      <div className="absolute -z-10 top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-200/40 blur-3xl opacity-60 dark:bg-emerald-800/30" />
      <div className="mx-auto w-full max-w-md space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
            Verificación Automática
          </h1>
          <p className="text-sm text-muted-foreground">
            Autenticando con Azure AD B2C. Este paso asegura acceso seguro al
            pipeline de procesamiento.
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-emerald-950/40 backdrop-blur px-6 py-8 shadow-lg shadow-emerald-200/40 dark:shadow-emerald-900/30">
          <div className="space-y-4">
            {!manualMode && !error && (
              <output
                className="flex items-center justify-center gap-2"
                aria-live="polite"
              >
                <Loader2
                  className="h-5 w-5 animate-spin text-emerald-600 dark:text-emerald-300"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Redirigiendo…
                </span>
              </output>
            )}
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            {manualMode && (
              <div className="space-y-3">
                <button
                  onClick={() => signIn("azure-ad-b2c", { callbackUrl: "/" })}
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
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
        <p className="text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Rotulado. Seguridad y trazabilidad.
        </p>
      </div>
    </div>
  );
}
