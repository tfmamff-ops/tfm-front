"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/auth-store";
import {
  Globe,
  Mail,
  MapPin,
  Monitor,
  Shield,
  User,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import UserAvatar from "@/components/ui/UserAvatar";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AppHeader() {
  const requestContext = useAuthStore((s) => s.requestContext);
  const user = requestContext?.user;
  const client = requestContext?.client;
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  // Prefetch /signin to make logout redirect feel instant
  useEffect(() => {
    router.prefetch("/signin");
  }, [router]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-3 min-w-0"
            aria-label="Inicio"
          >
            <Image
              src="/logo.svg"
              alt="App logo"
              className="h-10 w-10 rounded-full bg-green-600"
              width={40}
              height={40}
              priority
            />
            <div className="flex flex-col leading-tight min-w-0">
              {/* Responsive: smaller on mobile, larger on desktop */}
              <h1 className="text-sm md:text-lg font-extrabold text-green-600 tracking-tight truncate">
                Verificación Automática de Rotulado
              </h1>
              <span className="text-xs sm:text-sm text-muted-foreground truncate">
                Visión Artificial &amp; OCR
              </span>
            </div>
          </Link>

          {/* User capsule with hover card (desktop) and click (mobile) */}
          <HoverCard
            open={open}
            onOpenChange={setOpen}
            openDelay={200}
            closeDelay={100}
          >
            <HoverCardTrigger asChild>
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
              >
                <UserAvatar name={user?.name} imageUrl={undefined} size={24} />
                <span className="text-sm sm:text-base font-medium hidden sm:inline">
                  {user?.name}
                </span>
              </button>
            </HoverCardTrigger>
            <HoverCardContent
              align="end"
              sideOffset={8}
              className="w-[calc(100vw-2rem)] sm:w-80 p-4 bg-white/95 backdrop-blur-sm"
              onInteractOutside={() => setOpen(false)}
            >
              <div className="space-y-3">
                {/* User Section */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Usuario
                  </h4>
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex items-start gap-2">
                      <dt className="text-slate-600 min-w-14 sm:min-w-16 text-xs sm:text-sm">
                        Nombre:
                      </dt>
                      <dd className="font-medium text-slate-900 text-xs sm:text-sm">
                        {user?.name || "—"}
                      </dd>
                    </div>
                    <div className="flex items-start gap-2">
                      <dt className="text-slate-600 min-w-14 sm:min-w-16 text-xs sm:text-sm">
                        ID:
                      </dt>
                      <dd className="font-medium text-slate-900 text-xs sm:text-sm">
                        {user?.id || "—"}
                      </dd>
                    </div>
                    {user?.email && (
                      <div className="flex items-start gap-2">
                        <dt className="text-slate-600 min-w-14 sm:min-w-16 flex items-center gap-1 text-xs sm:text-sm">
                          <Mail className="h-3 w-3" />
                          Email:
                        </dt>
                        <dd className="font-medium text-slate-900 break-all text-xs sm:text-sm">
                          {user.email}
                        </dd>
                      </div>
                    )}
                    {user?.role && (
                      <div className="flex items-start gap-2">
                        <dt className="text-slate-600 min-w-14 sm:min-w-16 flex items-center gap-1 text-xs sm:text-sm">
                          <Shield className="h-3 w-3" />
                          Rol:
                        </dt>
                        <dd className="font-medium text-green-700 text-xs sm:text-sm">
                          {user.role}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <Separator />

                {/* Client Section */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
                    <Monitor className="h-3.5 w-3.5" />
                    Cliente
                  </h4>
                  <dl className="space-y-1.5 text-sm">
                    {client?.appVersion && (
                      <div className="flex items-start gap-2">
                        <dt className="text-slate-600 min-w-14 sm:min-w-16 text-xs sm:text-sm">
                          Versión:
                        </dt>
                        <dd className="font-medium text-slate-900 text-xs sm:text-sm">
                          {client.appVersion}
                        </dd>
                      </div>
                    )}
                    {client?.ip && (
                      <div className="flex items-start gap-2">
                        <dt className="text-slate-600 min-w-14 sm:min-w-16 flex items-center gap-1 text-xs sm:text-sm">
                          <MapPin className="h-3 w-3" />
                          IP:
                        </dt>
                        <dd className="font-mono text-[10px] sm:text-xs text-slate-700">
                          {client.ip}
                        </dd>
                      </div>
                    )}
                    {client?.userAgent && (
                      <div className="flex items-start gap-2">
                        <dt className="text-slate-600 min-w-14 sm:min-w-16 flex items-center gap-1 text-xs sm:text-sm">
                          <Globe className="h-3 w-3" />
                          Browser:
                        </dt>
                        <dd className="text-[10px] sm:text-xs text-slate-700 break-all line-clamp-3 sm:line-clamp-2">
                          {client.userAgent}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
                <Separator />
                <div className="flex justify-end pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (isLoggingOut) return;
                      setIsLoggingOut(true);
                      setOpen(false);
                      // Best-effort prefetch (already prefetched on mount), then sign out
                      router.prefetch("/signin");
                      signOut({ callbackUrl: "/api/auth/b2c-logout" });
                    }}
                    className="gap-1.5"
                    disabled={isLoggingOut}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </header>
      {isLoggingOut && (
        <div
          aria-live="polite"
          className="fixed inset-0 z-[9999] bg-white/80 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 bg-white/90 dark:bg-emerald-950/60 px-6 py-5 shadow-lg">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-600" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-200">
              Cerrando sesión…
            </p>
          </div>
        </div>
      )}
    </>
  );
}
