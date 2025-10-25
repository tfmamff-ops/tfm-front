"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/auth-store";
import { Globe, Mail, MapPin, Monitor, Shield, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function AppHeader() {
  const requestContext = useAuthStore((s) => s.requestContext);
  const user = requestContext?.user;
  const client = requestContext?.client;
  const [open, setOpen] = useState(false);

  return (
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
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white text-xs font-bold">
                {user?.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </span>
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
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    </header>
  );
}
