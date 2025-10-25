import { CalendarDays, ClipboardList, Tag } from "lucide-react";
import { FieldChip } from "./field-chip";
import { useAppStore } from "@/lib/store";

export default function DataDetail() {
  const expected = useAppStore((s) => s.expected);

  return (
    <>
      {expected.itemDesc ||
      expected.batch ||
      expected.expiry ||
      expected.order ? (
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
      ) : (
        <p className="text-sm text-slate-500">
          Aún no hay una línea de producción seleccionada.
        </p>
      )}
    </>
  );
}
