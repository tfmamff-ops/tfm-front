"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { useEffect, useState } from "react";

type ExpectedItem = { id: number; value: string };

type ExpectedResp = {
  item: ExpectedItem[];
  itemDesc: ExpectedItem[];
  batch: ExpectedItem[];
  order: ExpectedItem[];
  expiry: ExpectedItem[];
};

export default function ExpectedData() {
  const { expected, setExpected } = useAppStore();
  const [data, setData] = useState<ExpectedResp>({
    item: [],
    itemDesc: [],
    batch: [],
    order: [],
    expiry: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/expected")
      .then((r) => r.json())
      .then((resp) => {
        console.log("expected data response", resp);
        setData(resp);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Field keys we support
  type FieldKey = "itemDesc" | "batch" | "expiry" | "order";

  // Single source of truth for combos: used for rendering and for syncing values
  const combos: Array<{
    label: string;
    key: FieldKey;
    items: ExpectedItem[];
    readOnly: boolean;
  }> = [
    {
      label: "Medicamento",
      key: "itemDesc",
      items: data.itemDesc,
      readOnly: false,
    },
    { label: "Lote esperado", key: "batch", items: data.batch, readOnly: true },
    {
      label: "Vencimiento esperado",
      key: "expiry",
      items: data.expiry,
      readOnly: true,
    },
    {
      label: "Orden esperada",
      key: "order",
      items: data.order,
      readOnly: true,
    },
  ];

  const handleChange = (key: string, value: string, readOnly: boolean) => {
    if (readOnly) return;

    // When any non-readOnly field changes, auto-select all other fields from the same row (same id)
    const rowId = Number(value);
    const updates: Record<string, string | undefined> = { [key]: value };

    for (const combo of combos) {
      if (combo.key !== (key as FieldKey)) {
        const match = combo.items.find((x) => x.id === rowId);
        updates[combo.key] = match ? String(match.id) : undefined;
      }
    }

    setExpected(updates);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {combos.map(({ label, key, items, readOnly }) => {
        const selectedId = expected[key as keyof typeof expected];
        return (
          <div key={key}>
            <Label>{label}</Label>
            {loading ? (
              <div className="flex items-center justify-left h-10 px-3 py-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-green-600" />
              </div>
            ) : (
              <Select
                value={selectedId}
                onValueChange={(v) => handleChange(key, v, readOnly)}
              >
                <SelectTrigger
                  className={readOnly ? "cursor-not-allowed opacity-70" : ""}
                >
                  <SelectValue placeholder="Seleccionar…" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((x) => (
                    <SelectItem
                      key={x.id}
                      value={String(x.id)}
                      disabled={readOnly}
                    >
                      {x.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        );
      })}
    </div>
  );
}
