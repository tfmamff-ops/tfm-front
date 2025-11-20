"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import type { BarcodeState, Validation } from "@/lib/store";
import { buildOcrItems } from "@/lib/ocr-utils";
import { useAuthStore } from "@/lib/auth-store";
import { buildAnalyzeFormData } from "@/lib/payload";

type ApiResponse = {
  imageUrl?: string;
  instanceId?: string;
  ocrResult?: unknown;
  ocrOverlayImageUrl?: string;
  barcodeData?: BarcodeState;
  barcodeOverlayImageUrl?: string;
  barcodeRoiImageUrl?: string;
  validationData?: Validation;
};

async function postAnalyze(
  form: FormData
): Promise<{ ok: true; data: ApiResponse } | { ok: false; error: string }> {
  const res = await fetch("/api/azure-analyze", { method: "POST", body: form });
  if (!res.ok) {
    const { error } = await res
      .json()
      .catch(() => ({ error: "Processing error" }));
    return {
      ok: false,
      error: typeof error === "string" ? error : "Processing error",
    };
  }
  const data: ApiResponse = await res.json();
  return { ok: true, data };
}

function parseOcrLines(ocrResult: unknown): string[] {
  type OcrResultShape = {
    readResult?: { blocks?: Array<{ lines?: Array<{ text?: string }> }> };
  };
  const or = ocrResult as OcrResultShape | undefined;
  const isString = (v: unknown): v is string => typeof v === "string";
  return (
    or?.readResult?.blocks?.flatMap((b) =>
      (b?.lines ?? []).map((l) => l?.text).filter(isString)
    ) ?? []
  );
}

function applyImageUrls(
  data: ApiResponse,
  setters: {
    setProcessedImageUrl: (u: string) => void;
    setOcrOverlayImgUrl: (u: string) => void;
    setBarcodeOverlayImgUrl: (u: string) => void;
    setBarcodeRoiImgUrl: (u: string) => void;
  }
) {
  const {
    imageUrl,
    ocrOverlayImageUrl,
    barcodeOverlayImageUrl,
    barcodeRoiImageUrl,
  } = data;
  if (imageUrl) setters.setProcessedImageUrl(imageUrl);
  if (ocrOverlayImageUrl) setters.setOcrOverlayImgUrl(ocrOverlayImageUrl);
  if (barcodeOverlayImageUrl)
    setters.setBarcodeOverlayImgUrl(barcodeOverlayImageUrl);
  if (barcodeRoiImageUrl) setters.setBarcodeRoiImgUrl(barcodeRoiImageUrl);
}

function updateCounters(
  validationData: Validation | undefined,
  incCounter: (k: "inspected" | "ok" | "rejected", by?: number) => void
) {
  incCounter("inspected");
  if (validationData?.validationSummary) {
    incCounter("ok");
  } else {
    incCounter("rejected");
  }
}

export default function SendToAzureButton() {
  const hasImage = useAppStore((s) => !!s.file);

  const setLoading = useAppStore((s) => s.setLoading);
  const setError = useAppStore((s) => s.setError);
  const setInstanceId = useAppStore((s) => s.setInstanceId);
  const setOcrItems = useAppStore((s) => s.setOcrItems);
  const setBarcodeState = useAppStore((s) => s.setBarcodeState);
  const setValidation = useAppStore((s) => s.setValidation);
  const incCounter = useAppStore((s) => s.incCounter);

  const clearInstanceId = useAppStore((s) => s.clearInstanceId);
  const clearOcr = useAppStore((s) => s.clearOcr);
  const clearBarcode = useAppStore((s) => s.clearBarcode);
  const clearValidation = useAppStore((s) => s.clearValidation);
  const clearReport = useAppStore((s) => s.clearReport);

  const setProcessedImageUrl = useAppStore((s) => s.setProcessedImageUrl);
  const setOcrOverlayImgUrl = useAppStore((s) => s.setOcrOverlayImgUrl);
  const setBarcodeOverlayImgUrl = useAppStore((s) => s.setBarcodeOverlayImgUrl);
  const setBarcodeRoiImgUrl = useAppStore((s) => s.setBarcodeRoiImgUrl);

  const [clicking, setClicking] = useState(false);

  const handleClick = async () => {
    if (!hasImage || clicking) return;

    const file = useAppStore.getState().file;
    if (!file) return;

    setClicking(true);
    clearInstanceId();
    clearOcr();
    clearBarcode();
    clearValidation();
    clearReport();
    setLoading(true);

    try {
      const expectedData = useAppStore.getState().expectedData ?? {};
      const requestContext = useAuthStore.getState().requestContext;
      const form = buildAnalyzeFormData(file, expectedData, requestContext);

      const result = await postAnalyze(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      const data = result.data;
      applyImageUrls(data, {
        setProcessedImageUrl,
        setOcrOverlayImgUrl,
        setBarcodeOverlayImgUrl,
        setBarcodeRoiImgUrl,
      });

      if (data.instanceId) setInstanceId(data.instanceId);
      const lines = parseOcrLines(data.ocrResult);
      setOcrItems(buildOcrItems(lines.length ? lines : ["(No text detected)"]));
      if (data.barcodeData) setBarcodeState(data.barcodeData);
      if (data.validationData) setValidation(data.validationData);
      updateCounters(data.validationData, incCounter);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setLoading(false);
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
