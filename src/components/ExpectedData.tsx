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
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <Label>Medicamento</Label>
        {loading ? (
          <div className="flex items-center justify-left h-10 px-3 py-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-green-600" />
          </div>
        ) : (
          <Select
            value={expected.itemDesc}
            onValueChange={(v) => setExpected({ itemDesc: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar…" />
            </SelectTrigger>
            <SelectContent>
              {data.itemDesc.map((x) => (
                <SelectItem key={x.id} value={x.value}>
                  {x.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div>
        <Label>Lote esperado</Label>
        {loading ? (
          <div className="flex items-center justify-left h-10 px-3 py-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-green-600" />
          </div>
        ) : (
          <Select
            value={expected.batch}
            onValueChange={(v) => setExpected({ batch: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar…" />
            </SelectTrigger>
            <SelectContent>
              {data.batch.map((x) => (
                <SelectItem key={x.id} value={x.value}>
                  {x.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div>
        <Label>Vencimiento esperado</Label>
        {loading ? (
          <div className="flex items-center justify-left h-10 px-3 py-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-green-600" />
          </div>
        ) : (
          <Select
            value={expected.expiry}
            onValueChange={(v) => setExpected({ expiry: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar…" />
            </SelectTrigger>
            <SelectContent>
              {data.expiry.map((x) => (
                <SelectItem key={x.id} value={x.value}>
                  {x.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div>
        <Label>Orden esperada</Label>
        {loading ? (
          <div className="flex items-center justify-left h-10 px-3 py-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-green-600" />
          </div>
        ) : (
          <Select
            value={expected.order}
            onValueChange={(v) => setExpected({ order: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar…" />
            </SelectTrigger>
            <SelectContent>
              {data.order.map((x) => (
                <SelectItem key={x.id} value={x.value}>
                  {x.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
