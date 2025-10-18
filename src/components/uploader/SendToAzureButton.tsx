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
  const setBarcodeState = useAppStore((s) => s.setBarcodeState);
  const incCounter = useAppStore((s) => s.incCounter);
  const clearOcr = useAppStore((s) => s.clearOcr);
  const clearBarcode = useAppStore((s) => s.clearBarcode);

  const [clicking, setClicking] = useState(false);

  const handleClick = async () => {
    if (!hasImage || clicking) return;

    const file = useAppStore.getState().file;
    if (!file) return;

    setClicking(true);
    clearOcr();
    clearBarcode();
    setOcrLoading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      // Include expected values from the store as JSON
      const expected = useAppStore.getState().expected ?? {};
      try {
        form.append("expected", JSON.stringify(expected));
      } catch {
        // Ignore serialization issues; backend will treat as absent
      }

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
      const {
        imageUrl,
        barcodeOverlayImageUrl,
        barcodeRoiImageUrl,
        ocrResult,
        barcodeData,
      } = data;

      useAppStore.getState().setProcessedImageUrl?.(imageUrl);
      useAppStore.getState().setBarcodeOverlayImgUrl?.(barcodeOverlayImageUrl);
      useAppStore.getState().setBarcodeRoiImgUrl?.(barcodeRoiImageUrl);

      // Líneas de OCR (adapta a tu schema)
      const lines: string[] =
        ocrResult?.readResult?.blocks
          ?.flatMap(
            (b: any) => b?.lines?.map((l: any) => l?.text).filter(Boolean) ?? []
          )
          ?.filter(Boolean) ?? [];

      setOcrItems(buildOcrItems(lines.length ? lines : ["(No text detected)"]));
      setBarcodeState(barcodeData);
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
      {clicking ? "Analizando..." : "Procesar"}
    </Button>
  );
}
