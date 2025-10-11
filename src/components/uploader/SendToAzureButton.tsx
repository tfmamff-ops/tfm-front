"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { buildOcrItems } from "@/lib/ocr-utils";

export default function SendToAzureButton() {
  const hasImage = useAppStore((s) => !!s.file);
  const setOcrItems = useAppStore((s) => s.setOcrItems);
  const setOcrError = useAppStore((s) => s.setOcrError);
  const setOcrLoading = useAppStore((s) => s.setOcrLoading);
  const incCounter = useAppStore((s) => s.incCounter);

  const [clicking, setClicking] = useState(false);

  const handleClick = async () => {
    if (!hasImage || clicking) return;

    const file = useAppStore.getState().file;
    if (!file) return;

    setClicking(true);
    setOcrError(undefined);
    setOcrItems([]);
    setOcrLoading(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/azure-analyze", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const { error } = await res
          .json()
          .catch(() => ({ error: "Processing error" }));
        setOcrError(typeof error === "string" ? error : "Processing error");
        return;
      }

      const data = await res.json();
      const lines: string[] =
        data?.readResult?.blocks
          ?.flatMap(
            (b: any) => b?.lines?.map((l: any) => l?.text).filter(Boolean) ?? []
          )
          ?.filter(Boolean) ?? [];

      setOcrItems(buildOcrItems(lines.length ? lines : ["(No text detected)"]));
      incCounter("inspected");
    } catch (e: any) {
      setOcrError(e?.message || "Unexpected error");
    } finally {
      setOcrLoading(false);
      setClicking(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={!hasImage || clicking}
      className="w-full"
    >
      {clicking ? "Analizando..." : "Enviar a Azure"}
    </Button>
  );
}
