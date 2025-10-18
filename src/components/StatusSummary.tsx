"use client";

import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, ClipboardList, XCircle } from "lucide-react";
import type { ReactNode } from "react";

export default function StatusSummary() {
  const { inspected, ok, rejected } = useAppStore((s) => s.counters);

  return (
    <section
      aria-label="Resumen de estado"
      className="grid grid-cols-3 gap-3 text-center"
    >
      <StatCard
        icon={<ClipboardList className="h-4 w-4" aria-hidden="true" />}
        label="Inspeccionados"
        value={inspected}
        tone="default"
      />
      <StatCard
        icon={<BadgeCheck className="h-4 w-4" aria-hidden="true" />}
        label="OK"
        value={ok}
        tone="success"
      />
      <StatCard
        icon={<XCircle className="h-4 w-4" aria-hidden="true" />}
        label="Rechazados"
        value={rejected}
        tone="danger"
      />
    </section>
  );
}

type Tone = "default" | "success" | "danger";

const toneClasses: Record<Tone, string> = {
  default:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300",
  success:
    "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  danger:
    "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
};

function StatCard({
  icon,
  label,
  value,
  tone = "default",
}: Readonly<{
  icon: ReactNode;
  label: string;
  value: number | string;
  tone?: Tone;
}>) {
  const toneStyle = toneClasses[tone];

  return (
    <Card
      className={`rounded-2xl border ${toneStyle} shadow-sm hover:shadow-md transition-shadow`}
    >
      <CardContent className="p-3 flex flex-col items-center justify-center gap-1">
        <div className="flex flex-col items-center justify-center">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/60 dark:bg-white/10 shadow-sm">
            {icon}
          </span>
          <span className="mt-1 text-base font-medium opacity-80">{label}</span>
        </div>
        <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
