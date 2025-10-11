"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import HighlightedText from "@/components/HighlightedText";
import type { Pattern } from "@/lib/ocr-utils";

export default function OcrResultCard() {
  const { items, error, loading } = useAppStore((s) => s.ocr);
  const expected = useAppStore((s) => s.expected);

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
    content = items.map((item) => (
      <Badge
        key={item.id}
        variant="outline"
        className="text-sm font-mono whitespace-pre-wrap py-1 px-2 block text-left w-full justify-start"
      >
        <HighlightedText text={item.text} patterns={patterns} />
      </Badge>
    ));
  }

  return (
    <div className="py-3">
      <Card>
        <CardHeader>
          <CardTitle>Resultado de OCR</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">{content}</CardContent>
      </Card>
    </div>
  );
}
