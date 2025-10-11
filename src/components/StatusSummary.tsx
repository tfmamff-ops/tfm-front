"use client";

import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, ClipboardList, XCircle } from "lucide-react";
import type { ReactNode } from "react";

export default function StatusSummary() {
  const { inspected, ok, rejected } = useAppStore((s) => s.counters);

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard
        icon={<ClipboardList className="h-5 w-5" aria-hidden="true" />}
        label="Inspected"
        value={inspected}
        tone="default"
      />
      <StatCard
        icon={<BadgeCheck className="h-5 w-5" aria-hidden="true" />}
        label="OK"
        value={ok}
        tone="success"
      />
      <StatCard
        icon={<XCircle className="h-5 w-5" aria-hidden="true" />}
        label="Rejected"
        value={rejected}
        tone="danger"
      />
    </div>
  );
}

type Tone = "default" | "success" | "danger";

function StatCard(
  props: Readonly<{
    icon: ReactNode;
    label: string;
    value: number | string;
    tone?: Tone;
  }>
) {
  const tone = props.tone ?? "default";

  let toneClasses = "bg-muted text-foreground";
  if (tone === "success") {
    toneClasses =
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  } else if (tone === "danger") {
    toneClasses =
      "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  }

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span
            className={`inline-flex items-center justify-center rounded-md ${toneClasses} h-8 w-8`}
          >
            {props.icon}
          </span>
          <span>{props.label}</span>
        </div>
        <div className="mt-2 text-2xl font-semibold tabular-nums">
          {props.value}
        </div>
      </CardContent>
    </Card>
  );
}
