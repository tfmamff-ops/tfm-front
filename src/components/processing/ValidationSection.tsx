"use client";

import SectionHeader from "@/components/processing/SectionHeader";
import BoolBadge from "@/components/processing/BoolBadge";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck } from "lucide-react";

export default function ValidationSection({
  orderOK,
  batchOK,
  expiryOK,
  barcodeDetectedOK,
  barcodeLegibleOK,
  barcodeOK,
  validationSummary,
}: Readonly<{
  orderOK: boolean;
  batchOK: boolean;
  expiryOK: boolean;
  barcodeDetectedOK: boolean;
  barcodeLegibleOK: boolean;
  barcodeOK: boolean;
  validationSummary: boolean;
}>) {
  return (
    <div
      className={
        "rounded-xl border p-4 lg:col-span-2 " +
        (validationSummary
          ? "border-green-200 bg-green-50/60"
          : "border-rose-200 bg-rose-50/60")
      }
    >
      <SectionHeader
        icon={
          <ShieldCheck
            className={
              "h-4 w-4 " +
              (validationSummary ? "text-green-700" : "text-rose-700")
            }
          />
        }
        title="Validación"
      />
      <Separator className="my-3" />
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <dt className="text-sm text-slate-600">Lote</dt>
          <dd>
            <BoolBadge value={batchOK} />
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-sm text-slate-600">Vencimiento</dt>
          <dd>
            <BoolBadge value={expiryOK} />
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-sm text-slate-600">Orden</dt>
          <dd>
            <BoolBadge value={orderOK} />
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-sm text-slate-600">Código detectado</dt>
          <dd>
            <BoolBadge value={barcodeDetectedOK} />
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-sm text-slate-600">Código legible</dt>
          <dd>
            <BoolBadge value={barcodeLegibleOK} />
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-sm text-slate-600">Código válido</dt>
          <dd>
            <BoolBadge value={barcodeOK} />
          </dd>
        </div>
      </dl>

      <div
        className={
          "mt-4 rounded-xl border p-4 " +
          (validationSummary
            ? "border-green-300 bg-green-50/70"
            : "border-rose-300 bg-rose-50/70")
        }
        aria-live="polite"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck
            className={
              "h-5 w-5 " +
              (validationSummary ? "text-green-700" : "text-rose-700")
            }
            aria-hidden="true"
          />
          <span className="text-sm font-semibold uppercase tracking-wide">
            Aprobación
          </span>
          <BoolBadge value={validationSummary} />
        </div>
        <p className="mt-2 text-sm text-slate-600">
          {validationSummary
            ? "Todos los controles fueron exitosos."
            : "Alguno de los controles no fue satisfactorio."}
        </p>
      </div>
    </div>
  );
}
