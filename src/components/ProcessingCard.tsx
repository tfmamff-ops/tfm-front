"use client";

import { useMemo, useState } from "react";
import type React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import HighlightedText from "@/components/HighlightedText";
import type { Pattern } from "@/lib/ocr-utils";
import Link from "next/link";
import {
  ExternalLink,
  PanelsTopLeft,
  Image,
  Copy,
  Check,
  Scan,
  Crop,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Section header with icon and title
function SectionHeader({
  icon,
  title,
}: Readonly<{ icon: React.ReactNode; title: string }>) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-green-900/80">
      {icon}
      <span>{title}</span>
    </div>
  );
}

// Boolean badge with clear color semantics
function BoolBadge({ value }: Readonly<{ value: boolean }>) {
  return (
    <Badge
      variant="outline"
      className={
        value
          ? "border-green-300 bg-green-50 text-green-700"
          : "border-slate-300 bg-slate-50 text-slate-600"
      }
    >
      {value ? "Sí" : "No"}
    </Badge>
  );
}

export default function ProcessingCard() {
  const expected = useAppStore((s) => s.expected);
  const { items, error, loading } = useAppStore((s) => s.ocr);
  const { barcodeDetected, barcodeLegible, decodedValue, barcodeSymbology } =
    useAppStore((s) => s.barcode);
  const processedImgUrl = useAppStore((s) => s.processedImgUrl);
  const barcodeOverlayImgUrl = useAppStore((s) => s.barcodeOverlayImgUrl);
  const barcodeRoiImgUrl = useAppStore((s) => s.barcodeRoiImgUrl);

  const patterns = useMemo<Pattern[]>(
    () => [
      { value: expected?.batch ?? "", className: "bg-sky-200" },
      { value: expected?.expiry ?? "", className: "bg-green-200" },
      { value: expected?.order ?? "", className: "bg-purple-200" },
    ],
    [expected?.batch, expected?.expiry, expected?.order]
  );

  let content: React.ReactNode = null;

  // Copy to clipboard feedback for decoded value
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

  // Reusable renderer for external links with consistent styling
  const renderExternalLink = (
    href?: string,
    label: string = "Imagen procesada",
    icon: React.ReactNode = <Image className="h-4 w-4" />
  ) => (
    <>
      {href ? (
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm text-green-600 underline hover:text-green-700"
        >
          {icon}
          {label}
          <ExternalLink className="h-3 w-3 opacity-70 ml-1" />
        </Link>
      ) : null}
    </>
  );

  // (helper components moved to module scope to satisfy linter)

  if (loading) {
    content = <p className="text-base text-muted-foreground">Procesando…</p>;
  } else if (error) {
    content = <p className="text-red-600 text-base">{error}</p>;
  } else if (!items || items.length === 0) {
    content = <p className="text-base text-muted-foreground">Sin datos</p>;
  } else {
    const lines = items.map((item) => (
      <Badge
        key={item.id}
        variant="outline"
        className="text-base font-mono whitespace-pre-wrap py-1.5 px-2.5 block text-left w-full justify-start"
      >
        <HighlightedText text={item.text} patterns={patterns} />
      </Badge>
    ));
    const hasAnyLink =
      Boolean(processedImgUrl) ||
      Boolean(barcodeOverlayImgUrl) ||
      Boolean(barcodeRoiImgUrl);

    content = (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OCR section */}
        <div className="rounded-xl border border-green-100 bg-white/70 p-4">
          <SectionHeader
            icon={<PanelsTopLeft className="h-4 w-4 text-green-700" />}
            title="OCR"
          />
          <Separator className="my-3" />
          <div className="max-h-56 overflow-y-auto space-y-1.5">{lines}</div>
        </div>

        {/* Barcode section */}
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
                    title={
                      (
                        {
                          QR: "QR Code",
                          EAN13: "EAN-13 (retail)",
                          EAN8: "EAN-8 (retail)",
                          CODE128: "Code 128 (alfanumérico)",
                          CODE39: "Code 39",
                          PDF417: "PDF417",
                          DATAMATRIX: "Data Matrix",
                        } as Record<string, string>
                      )[barcodeSymbology] || barcodeSymbology
                    }
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

        {/* Processed images section (full width) */}
        {hasAnyLink && (
          <div className="rounded-xl border border-green-100 bg-white/70 p-4 lg:col-span-2">
            <SectionHeader
              icon={<Image className="h-4 w-4 text-green-700" />}
              title="Imágenes del proceso"
            />
            <Separator className="my-3" />
            <div className="flex flex-col gap-1">
              {renderExternalLink(
                processedImgUrl,
                "Imagen procesada",
                <Image className="h-4 w-4" />
              )}
              {renderExternalLink(
                barcodeOverlayImgUrl,
                "Código de barras detectado",
                <Scan className="h-4 w-4" />
              )}
              {renderExternalLink(
                barcodeRoiImgUrl,
                "ROI",
                <Crop className="h-4 w-4" />
              )}
            </div>
          </div>
        )}
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
              <PanelsTopLeft
                className="h-4 w-4 text-green-700"
                aria-hidden="true"
              />
              <h3 className="text-lg font-semibold tracking-tight text-green-900">
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
