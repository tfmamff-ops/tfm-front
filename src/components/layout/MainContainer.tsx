"use client";

import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

export default function MainContainer({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isSignin = pathname === "/signin";
  const userId = useAuthStore((s) => s.requestContext?.user.id ?? "no-user");

  if (isSignin) {
    // On signin, render a simpler full-height container without the card shell.
    return (
      <main
        key={`signin-${userId}`}
        className="flex-1 mx-auto w-full max-w-5xl px-4 py-8"
      >
        {children}
      </main>
    );
  }

  return (
    <main
      key={`app-${userId}`}
      className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 py-6"
    >
      <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/5 shadow-lg shadow-emerald-900/5 p-4 sm:p-6 lg:p-8 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
        {children}
      </div>
    </main>
  );
}
