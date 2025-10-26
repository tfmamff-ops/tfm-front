"use client";

// Using a combobox-style Select for a cleaner UX
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ErpItem } from "@/lib/store";
import { useAppStore } from "@/lib/store";
import { useEffect } from "react";
import DataDetail from "./DataDetail";

export default function ExpectedData() {
  const {
    setExpectedData,
    erpResp,
    isErpRespLoaded,
    setErpResp,
    setIsErpRespLoaded,
    selectedErpId,
    setSelectedErpId,
  } = useAppStore();

  useEffect(() => {
    // Only fetch if data hasn't been loaded yet
    if (isErpRespLoaded) {
      return;
    }

    fetch("/api/expectedData")
      .then((r) => r.json())
      .then((resp) => {
        setErpResp(resp);
        setIsErpRespLoaded(true);
      })
      .catch(() => {
        // On error, mark as loaded to prevent infinite retries
        setIsErpRespLoaded(true);
      });
  }, [isErpRespLoaded, setErpResp, setIsErpRespLoaded]);

  // Note: We keep UI simple with a single combo and details below.

  // Get data from store or use empty default
  const data = erpResp || {
    prodCode: [],
    prodDesc: [],
    lot: [],
    packDate: [],
    expDate: [],
  };

  // Select a row by id and propagate textual values to the store
  const selectRow = (rowId: number) => {
    const get = (arr: ErpItem[]) => arr.find((x) => x.id === rowId)?.value;
    setExpectedData({
      prodCode: get(data.prodCode),
      prodDesc: get(data.prodDesc),
      lot: get(data.lot),
      expDate: get(data.expDate),
      packDate: get(data.packDate),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        {isErpRespLoaded ? (
          <Select
            value={selectedErpId || ""}
            onValueChange={(v) => {
              setSelectedErpId(v);
              const id = Number(v);
              if (Number.isFinite(id)) selectRow(id);
            }}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Seleccione un producto" />
            </SelectTrigger>
            <SelectContent
              align="start"
              position="popper"
              className="w-[--radix-select-trigger-width]"
            >
              {data.prodDesc.map((it) => (
                <SelectItem key={it.id} value={String(it.id)}>
                  <div className="flex flex-col text-left">
                    <span className="font-medium text-slate-800">
                      {it.value}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {data.lot.find((x) => x.id === it.id)?.value} ·{" "}
                      {data.expDate.find((x) => x.id === it.id)?.value} ·{" "}
                      {data.packDate.find((x) => x.id === it.id)?.value}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center h-9 mt-1 px-3 py-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-green-600" />
          </div>
        )}
      </div>

      {/* Details: only show when a selection exists for a professional clean initial state */}
      <DataDetail />
    </div>
  );
}
