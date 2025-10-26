"use client";

import BoolBadge from "@/components/processing/BoolBadge";
import SectionHeader from "@/components/processing/SectionHeader";
import { Separator } from "@/components/ui/separator";
import { ShieldAlert, ShieldCheck, ShieldEllipsis } from "lucide-react";
import { Button } from "../ui/button";

export default function ValidationSection({
  lotOk,
  expDateOk,
  packDateOk,
  barcodeDetectedOk,
  barcodeLegibleOk,
  barcodeOk,
  validationSummary,
}: Readonly<{
  lotOk: boolean;
  expDateOk: boolean;
  packDateOk: boolean;
  barcodeDetectedOk: boolean;
  barcodeLegibleOk: boolean;
  barcodeOk: boolean;
  validationSummary: boolean;
}>) {
  const shieldIcon = validationSummary ? (
    <ShieldEllipsis className="h-4 w-4 text-green-700" />
  ) : (
    <ShieldEllipsis className="h-4 w-4 text-rose-700" />
  );

  const shieldSummary = validationSummary ? (
    <ShieldCheck className="h-4 w-4 text-green-700" />
  ) : (
    <ShieldAlert className="h-4 w-4 text-rose-700" />
  );

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
        icon={shieldIcon}
        title={
          <span
            className={validationSummary ? "text-green-700" : "text-rose-700"}
          >
            Validación
          </span>
        }
      />
      <Separator
        className={
          "my-3 " + (validationSummary ? "bg-green-300" : "bg-rose-300")
        }
      />
      <div className="space-y-4">
        {/* OCR Section */}
        <div
          className={
            "mt-4 rounded-xl border p-4 " +
            (validationSummary
              ? "border-green-300 bg-green-50/70"
              : "border-rose-300 bg-rose-50/70")
          }
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            OCR
          </h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
            <div className="flex items-center gap-2">
              <dt className="text-sm text-slate-600">Lote</dt>
              <dd>
                <BoolBadge value={lotOk} text={lotOk ? "Correcto" : "Error"} />
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-sm text-slate-600">Vencimiento</dt>
              <dd>
                <BoolBadge
                  value={expDateOk}
                  text={expDateOk ? "Correcto" : "Error"}
                />
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-sm text-slate-600">Orden</dt>
              <dd>
                <BoolBadge
                  value={packDateOk}
                  text={packDateOk ? "Correcto" : "Error"}
                />
              </dd>
            </div>
          </dl>
        </div>

        {/* Barcode Section */}
        <div
          className={
            "mt-4 rounded-xl border p-4 " +
            (validationSummary
              ? "border-green-300 bg-green-50/70"
              : "border-rose-300 bg-rose-50/70")
          }
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            Código de barras
          </h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
            <div className="flex items-center gap-2">
              <dt className="text-sm text-slate-600">Detectado</dt>
              <dd>
                <BoolBadge value={barcodeDetectedOk} />
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-sm text-slate-600">Legible</dt>
              <dd>
                <BoolBadge value={barcodeLegibleOk} />
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-sm text-slate-600">Válido</dt>
              <dd>
                <BoolBadge value={barcodeOk} />
              </dd>
            </div>
          </dl>
        </div>
      </div>

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
          {shieldSummary}
          <span
            className={
              "text-sm font-semibold uppercase tracking-wide " +
              (validationSummary ? "text-green-700" : "text-rose-700")
            }
          >
            {validationSummary ? "Aprobado" : "No aprobado"}
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <p className="text-sm text-slate-600">
            {validationSummary
              ? "Todos los controles fueron exitosos."
              : "Alguno de los controles no fue satisfactorio."}
          </p>
          <Button
            type="button"
            onClick={() => {
              alert("No implementado aún");
            }}
            className="md:ml-auto"
          >
            Generar informe
          </Button>
        </div>
      </div>
    </div>
  );
}
