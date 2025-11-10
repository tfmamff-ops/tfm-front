"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

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
    <div className="relative isolate min-h-dvh flex flex-col items-center justify-center py-16">
      <div className="absolute -z-10 top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8bd3b1]/20 dark:bg-[#6ea48a]/20 blur-3xl" />
      <div className="mx-auto w-full max-w-md space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
            Verificación Automática
          </h1>
          <p className="text-sm text-muted-foreground">
            Autenticando usuario de forma segura a través de Azure AD B2C.
          </p>
        </div>
        {/* Outer grid square (smaller, centered) */}
        <div className="mx-auto w-full max-w-sm">
          {/* Inner white card (smaller) */}
          <div className="relative m-4 rounded-xl border border-emerald-200/60 dark:border-white/10 bg-white/90 dark:bg-emerald-950/60 px-6 py-5 shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={44}
                height={44}
                className="rounded-full"
              />
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
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
              {manualMode && (
                <div className="space-y-2">
                  <Button
                    type="button"
                    onClick={() => signIn("azure-ad-b2c", { callbackUrl: "/" })}
                  >
                    Ingresar manualmente
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground flex flex-col items-center leading-tight">
          <span>© {new Date().getFullYear()} AGMCorp & Urbit</span>
          <span>Seguridad y trazabilidad</span>
        </p>
      </div>
    </div>
  );
}
