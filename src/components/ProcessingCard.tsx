"use client";

import BarcodeSection from "@/components/processing/BarcodeSection";
import OcrSection from "@/components/processing/OcrSection";
import ProcessImagesSection from "@/components/processing/ProcessImagesSection";
import ValidationSection from "@/components/processing/ValidationSection";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { SlidersHorizontal } from "lucide-react";
import type React from "react";

export default function ProcessingCard() {
  const items = useAppStore((s) => s.ocr.items);
  const error = useAppStore((s) => s.error);
  const loading = useAppStore((s) => s.loading);
  const { barcodeDetected, barcodeLegible, decodedValue, barcodeSymbology } =
    useAppStore((s) => s.barcode);
  const processedImgUrl = useAppStore((s) => s.processedImgUrl);
  const ocrOverlayImgUrl = useAppStore((s) => s.ocrOverlayImgUrl);
  const barcodeOverlayImgUrl = useAppStore((s) => s.barcodeOverlayImgUrl);
  const barcodeRoiImgUrl = useAppStore((s) => s.barcodeRoiImgUrl);
  const validation = useAppStore((s) => s.validation);

  let content: React.ReactNode = null;

  if (loading) {
    content = <p className="text-base text-muted-foreground">Procesando…</p>;
  } else if (error) {
    content = <p className="text-red-600 text-base">{error}</p>;
  } else if (!items || items.length === 0) {
    content = <p className="text-base text-muted-foreground">Sin datos</p>;
  } else {
    const hasAnyLink =
      Boolean(processedImgUrl) ||
      Boolean(ocrOverlayImgUrl) ||
      Boolean(barcodeOverlayImgUrl) ||
      Boolean(barcodeRoiImgUrl);

    content = (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OcrSection items={items} />
        <BarcodeSection
          barcodeDetected={!!barcodeDetected}
          barcodeLegible={!!barcodeLegible}
          decodedValue={decodedValue}
          barcodeSymbology={barcodeSymbology}
        />
        {hasAnyLink && (
          <ProcessImagesSection
            processedImgUrl={processedImgUrl}
            ocrOverlayImgUrl={ocrOverlayImgUrl}
            barcodeOverlayImgUrl={barcodeOverlayImgUrl}
            barcodeRoiImgUrl={barcodeRoiImgUrl}
          />
        )}
        <ValidationSection
          orderOK={validation.orderOK}
          batchOK={validation.batchOK}
          expiryOK={validation.expiryOK}
          barcodeDetectedOK={validation.barcodeDetectedOK}
          barcodeLegibleOK={validation.barcodeLegibleOK}
          barcodeOK={validation.barcodeOK}
          validationSummary={validation.validationSummary}
        />
      </div>
    );
  }

  return (
    <div className="py-3">
      <Card className="rounded-2xl border shadow-md bg-gradient-to-b from-white to-green-50/40 py-0">
        <CardContent className="p-0">
          {/* Accent header */}
          <div className="flex items-center justify-between rounded-t-2xl border-b bg-green-50/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal
                className="h-4 w-4 text-green-700"
                aria-hidden="true"
              />
              <h3 className="text-xs md:text-sm font-semibold tracking-tight text-green-900">
                Procesamiento
              </h3>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex flex-col gap-4">{content}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
