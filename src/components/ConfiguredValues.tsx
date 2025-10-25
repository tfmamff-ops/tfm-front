"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { CalendarDays, ClipboardList, Factory, Tag } from "lucide-react";

export default function ConfiguredValues() {
  const expected = useAppStore((s) => s.expected);

  return (
    <Card className="rounded-2xl border shadow-md bg-gradient-to-b from-white to-green-50/40 py-0">
      <CardContent className="p-0">
        {/* Accent header */}
        <div className="flex items-center justify-between rounded-t-2xl border-b bg-green-50/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <Factory className="h-4 w-4 text-green-700" aria-hidden="true" />
            <h3 className="text-xs md:text-sm font-semibold tracking-tight text-green-900">
              Línea de producción configurada
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FieldChip
              label="Medicamento"
              value={expected.itemDesc}
              icon={<Tag className="h-4 w-4" aria-hidden="true" />}
              tone="indigo"
            />

            <FieldChip
              label="Lote"
              value={expected.batch}
              icon={<Tag className="h-4 w-4" aria-hidden="true" />}
              tone="amber"
            />
            <FieldChip
              label="Vencimiento"
              value={expected.expiry}
              icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
              tone="purple"
            />
            <FieldChip
              label="Orden"
              value={expected.order}
              icon={<ClipboardList className="h-4 w-4" aria-hidden="true" />}
              tone="cyan"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type Tone = "indigo" | "amber" | "purple" | "cyan";

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
    indigo:
      "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-900",
    amber:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900",
    purple:
      "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-900",
    cyan: "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-200 dark:border-cyan-900",
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
