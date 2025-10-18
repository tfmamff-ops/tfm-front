"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";

type ExpectedResp = { batch: string[]; order: string[]; expiry: string[] };

export default function ExpectedData() {
  const { expected, setExpected } = useAppStore();
  const [data, setData] = useState<ExpectedResp>({
    batch: [],
    order: [],
    expiry: [],
  });

  useEffect(() => {
    fetch("/api/expected")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label>Lote esperado</Label>
        <Select
          value={expected.batch}
          onValueChange={(v) => setExpected({ batch: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar…" />
          </SelectTrigger>
          <SelectContent>
            {data.batch.map((x) => (
              <SelectItem key={x} value={x}>
                {x}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Vencimiento esperado</Label>
        <Select
          value={expected.expiry}
          onValueChange={(v) => setExpected({ expiry: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar…" />
          </SelectTrigger>
          <SelectContent>
            {data.expiry.map((x) => (
              <SelectItem key={x} value={x}>
                {x}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Orden esperada</Label>
        <Select
          value={expected.order}
          onValueChange={(v) => setExpected({ order: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar…" />
          </SelectTrigger>
          <SelectContent>
            {data.order.map((x) => (
              <SelectItem key={x} value={x}>
                {x}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
