"use client";

import SectionHeader from "@/components/processing/SectionHeader";
import { Separator } from "@/components/ui/separator";
import { Crop, ExternalLink, Image, ScanBarcode, Wand2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export default function ProcessImagesSection({
  processedImgUrl,
  barcodeOverlayImgUrl,
  barcodeRoiImgUrl,
}: Readonly<{
  processedImgUrl?: string;
  barcodeOverlayImgUrl?: string;
  barcodeRoiImgUrl?: string;
}>) {
  const hasAnyLink =
    Boolean(processedImgUrl) ||
    Boolean(barcodeOverlayImgUrl) ||
    Boolean(barcodeRoiImgUrl);
  if (!hasAnyLink) return null;

  const renderExternalLink = (
    href?: string,
    label: ReactNode = "Imagen procesada",
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

  return (
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
          <Wand2 className="h-4 w-4" />
        )}
        {renderExternalLink(
          barcodeOverlayImgUrl,
          <>
            <span className="md:hidden">Código de barras</span>
            <span className="hidden md:inline">Código de barras detectado</span>
          </>,
          <ScanBarcode className="h-4 w-4" />
        )}
        {renderExternalLink(
          barcodeRoiImgUrl,
          "ROI",
          <Crop className="h-4 w-4" />
        )}
      </div>
    </div>
  );
}
