"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function SignInClient() {
  const startedRef = useRef(false);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    signIn("azure-ad-b2c", { callbackUrl: "/" }).catch((e) => {
      console.error("Auto sign-in failed", e);
      setError(true);
    });
  }, []);

  return (
    <div
      aria-live="polite"
      className="fixed inset-0 z-[9999] bg-white/80 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 bg-white/90 dark:bg-emerald-950/60 px-6 py-5 shadow-lg text-center">
        {!error && (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-600" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-200">
              Redirigiendo…
            </p>
          </>
        )}
        {error && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-200">
              <span className="block">
                Error en el inicio de sesión automático.
              </span>
            </p>
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
  );
}
