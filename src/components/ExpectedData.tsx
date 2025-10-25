"use client";

import { Label } from "@/components/ui/label";
// Using a combobox-style Select for a cleaner UX
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldChip } from "@/components/ui/field-chip";
import { useAppStore } from "@/lib/store";
import { useEffect, useState } from "react";
import DataDetail from "./ui/DataDetail";

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
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
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

  // Note: We keep UI simple with a single combo for Medicamento and details below.

  // Select a row by id and propagate textual values to the store
  const selectRow = (rowId: number) => {
    const get = (arr: ExpectedItem[]) => arr.find((x) => x.id === rowId)?.value;
    setExpected({
      itemDesc: get(data.itemDesc),
      batch: get(data.batch),
      expiry: get(data.expiry),
      order: get(data.order),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Medicamento</Label>
        {loading ? (
          <div className="flex items-center h-9 mt-1 px-3 py-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-green-600" />
          </div>
        ) : (
          <Select
            value={selectedId}
            onValueChange={(v) => {
              setSelectedId(v);
              const id = Number(v);
              if (Number.isFinite(id)) selectRow(id);
            }}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Seleccione un medicamento" />
            </SelectTrigger>
            <SelectContent
              align="start"
              position="popper"
              className="w-[--radix-select-trigger-width]"
            >
              {data.itemDesc.map((it) => (
                <SelectItem key={it.id} value={String(it.id)}>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-800">
                      {it.value}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {data.batch.find((x) => x.id === it.id)?.value} ·{" "}
                      {data.expiry.find((x) => x.id === it.id)?.value} ·{" "}
                      {data.order.find((x) => x.id === it.id)?.value}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Details: only show when a selection exists for a professional clean initial state */}
      <DataDetail />
    </div>
  );
}
