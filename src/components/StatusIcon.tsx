"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Clock,
  HelpCircle,
  Loader2,
  TriangleAlert,
  XCircle,
} from "lucide-react";

type StatusKind =
  | "ok"
  | "rejected"
  | "pending"
  | "processing"
  | "warning"
  | "unknown";

const STATUS_MAP: Record<
  StatusKind,
  {
    Icon: LucideIcon;
    color: string;
    bg: string;
    label: string;
    spin?: boolean;
  }
> = {
  ok: {
    Icon: BadgeCheck,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    label: "Correcto",
  },
  rejected: {
    Icon: XCircle,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    label: "Rechazado",
  },
  pending: {
    Icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    label: "Pendiente",
  },
  processing: {
    Icon: Loader2,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    label: "Procesando",
    spin: true,
  },
  warning: {
    Icon: TriangleAlert,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/40",
    label: "Advertencia",
  },
  unknown: {
    Icon: HelpCircle,
    color: "text-muted-foreground",
    bg: "bg-muted/60",
    label: "Desconocido",
  },
};

export function StatusIcon({
  status,
  size = 18,
  className,
  label,
}: Readonly<{
  status: StatusKind;
  size?: number;
  className?: string;
  label?: string; // Accessible label; if omitted we infer a default
}>) {
  const variant = STATUS_MAP[status] ?? STATUS_MAP.unknown;
  const ariaLabel = label ?? variant.label;
  const Icon = variant.Icon;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md",
        variant.color,
        variant.bg,
        className
      )}
      style={{ width: size + 6, height: size + 6 }}
    >
      <Icon
        aria-hidden
        className={cn("shrink-0", variant.spin && "animate-spin")}
        size={size}
      />
      <span className="sr-only">{ariaLabel}</span>
    </span>
  );
}

export type { StatusKind };
