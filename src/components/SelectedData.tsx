"use client";

import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CalendarDays, Tag, ClipboardList, PanelsTopLeft } from "lucide-react";

export default function SelectedData() {
  const expected = useAppStore((s) => s.expected);

  return (
    <Card className="rounded-2xl border shadow-md bg-gradient-to-b from-white to-green-50/40 py-0">
      <CardContent className="p-0">
        {/* Accent header */}
        <div className="flex items-center justify-between rounded-t-2xl border-b bg-green-50/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <PanelsTopLeft
              className="h-4 w-4 text-green-700"
              aria-hidden="true"
            />
            <h3 className="text-lg font-semibold tracking-tight text-green-900">
              Datos esperados
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FieldChip
              label="Lote"
              value={expected.batch}
              icon={<Tag className="h-4 w-4" aria-hidden="true" />}
              tone="sky"
            />
            <FieldChip
              label="Vencimiento"
              value={expected.expiry}
              icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
              tone="emerald"
            />
            <FieldChip
              label="Orden"
              value={expected.order}
              icon={<ClipboardList className="h-4 w-4" aria-hidden="true" />}
              tone="violet"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type Tone = "sky" | "emerald" | "violet";

function FieldChip({
  label,
  value,
  icon,
  tone,
}: Readonly<{
  label: string;
  value?: string;
  icon: React.ReactNode;
  tone: Tone;
}>) {
  const empty = !value;

  const toneClasses: Record<Tone, string> = {
    sky: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-900",
    emerald:
      "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900",
    violet:
      "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-200 dark:border-violet-900",
  };

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
