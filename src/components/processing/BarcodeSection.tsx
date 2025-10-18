"use client";

import { useState } from "react";
import { Scan, Check, Copy } from "lucide-react";
import SectionHeader from "@/components/processing/SectionHeader";
import BoolBadge from "@/components/processing/BoolBadge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { describeSymbology } from "@/lib/ocr-utils";

export default function BarcodeSection({
  barcodeDetected,
  barcodeLegible,
  decodedValue,
  barcodeSymbology,
}: Readonly<{
  barcodeDetected: boolean;
  barcodeLegible: boolean;
  decodedValue: string;
  barcodeSymbology: string;
}>) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-xl border border-green-100 bg-white/70 p-4">
      <SectionHeader
        icon={<Scan className="h-4 w-4 text-green-700" />}
        title="Código de barras"
      />
      <Separator className="my-3" />
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <dt className="text-sm text-slate-600">Detectado</dt>
          <dd>
            <BoolBadge value={!!barcodeDetected} />
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-sm text-slate-600">Legible</dt>
          <dd>
            <BoolBadge value={!!barcodeLegible} />
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-sm text-slate-600">Valor decodificado</dt>
          <dd className="text-base flex items-center gap-2">
            {decodedValue?.trim() ? (
              <>
                <span className="font-mono">{decodedValue}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => handleCopy(decodedValue)}
                  aria-label={copied ? "Copiado" : "Copiar"}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </>
            ) : (
              <span className="text-slate-500">—</span>
            )}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-sm text-slate-600">Simbología</dt>
          <dd className="text-base">
            {barcodeSymbology?.trim() ? (
              <span
                title={describeSymbology(barcodeSymbology) ?? barcodeSymbology}
              >
                {barcodeSymbology}
              </span>
            ) : (
              <span className="text-slate-500">—</span>
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}
