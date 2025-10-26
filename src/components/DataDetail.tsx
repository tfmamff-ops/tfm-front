import { CalendarDays, ClipboardList, Tag } from "lucide-react";
import { FieldChip } from "./ui/field-chip";
import { useAppStore } from "@/lib/store";

export default function DataDetail() {
  const expectedData = useAppStore((s) => s.expectedData);
  const visible =
    !!expectedData.prodDesc ||
    !!expectedData.lot ||
    !!expectedData.expDate ||
    !!expectedData.packDate;

  return (
    <>
      {visible && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FieldChip
            label="Producto"
            value={expectedData.prodDesc}
            icon={<Tag className="h-4 w-4" aria-hidden="true" />}
            tone="indigo"
          />

          <FieldChip
            label="Lote"
            value={expectedData.lot}
            icon={<Tag className="h-4 w-4" aria-hidden="true" />}
            tone="amber"
          />
          <FieldChip
            label="Fecha de vencimiento"
            value={expectedData.expDate}
            icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
            tone="purple"
          />
          <FieldChip
            label="Fecha de envasado"
            value={expectedData.packDate}
            icon={<ClipboardList className="h-4 w-4" aria-hidden="true" />}
            tone="cyan"
          />
        </div>
      )}
    </>
  );
}
