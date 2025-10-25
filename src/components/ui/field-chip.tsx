"use client";

import { Label } from "@/components/ui/label";
import React from "react";

export type Tone = "indigo" | "amber" | "purple" | "cyan";

const toneClasses: Record<Tone, string> = {
  indigo:
    "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-900",
  amber:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900",
  purple:
    "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-900",
  cyan: "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-200 dark:border-cyan-900",
};

export function FieldChip({
  label,
  value,
  tone,
  icon,
}: Readonly<{
  label: string;
  value?: string;
  tone: Tone;
  icon?: React.ReactNode;
}>) {
  const empty = !value;
  return (
    <div className="space-y-1">
      <Label className="text-lg">{label}</Label>
      <div
        className={[
          "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm",
          toneClasses[tone],
          empty && "opacity-60",
        ].join(" ")}
      >
        {icon}
        <span className={empty ? "tabular-nums" : "font-medium tabular-nums"}>
          {value ?? "—"}
        </span>
      </div>
    </div>
  );
}
