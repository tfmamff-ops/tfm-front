"use client";

import { ReactNode, useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";

export default function HydrationGate({
  children,
  fallback = null,
}: Readonly<{
  children: ReactNode;
  fallback?: ReactNode;
}>) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // if persist finished already, hasHydrated() will be true
    if (useAppStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useAppStore.persist.onFinishHydration(() =>
      setHydrated(true)
    );
    return () => unsub();
  }, []);

  if (!hydrated) return <>{fallback}</>;
  return <>{children}</>;
}
