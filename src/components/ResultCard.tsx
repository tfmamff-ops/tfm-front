"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import HighlightedText from "@/components/HighlightedText";
import type { Pattern } from "@/lib/ocr-utils";
import Link from "next/link";
import { ExternalLink, PanelsTopLeft, Image } from "lucide-react";

export default function ResultCard() {
  const { items, error, loading } = useAppStore((s) => s.ocr);
  const expected = useAppStore((s) => s.expected);
  const processedImgUrl = useAppStore((s) => s.processedImgUrl);

  const patterns = useMemo<Pattern[]>(
    () => [
      { value: expected?.batch ?? "", className: "bg-sky-200" },
      { value: expected?.expiry ?? "", className: "bg-green-200" },
      { value: expected?.order ?? "", className: "bg-purple-200" },
    ],
    [expected?.batch, expected?.expiry, expected?.order]
  );

  let content: React.ReactNode = null;

  if (loading) {
    content = <p className="text-sm text-muted-foreground">Procesando…</p>;
  } else if (error) {
    content = <p className="text-red-600 text-sm">{error}</p>;
  } else if (!items || items.length === 0) {
    content = <p className="text-sm text-muted-foreground">Sin datos</p>;
  } else {
    const lines = items.map((item) => (
      <Badge
        key={item.id}
        variant="outline"
        className="text-sm font-mono whitespace-pre-wrap py-1 px-2 block text-left w-full justify-start"
      >
        <HighlightedText text={item.text} patterns={patterns} />
      </Badge>
    ));
    const imgUrl = (
      <div className="py-3">
        {processedImgUrl ? (
          <Link
            href={processedImgUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm text-green-600 underline hover:text-green-700"
          >
            <Image className="h-4 w-4" />
            Imagen procesada
            <ExternalLink className="h-3 w-3 opacity-70 ml-1" />
          </Link>
        ) : null}
      </div>
    );
    content = (
      <>
        <div className="max-h-48 overflow-y-auto space-y-1">{lines}</div>
        {imgUrl}
      </>
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
