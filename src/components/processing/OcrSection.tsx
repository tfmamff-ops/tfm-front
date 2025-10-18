"use client";

import { PanelsTopLeft } from "lucide-react";
import SectionHeader from "@/components/processing/SectionHeader";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import HighlightedText from "@/components/HighlightedText";
import type { Pattern } from "@/lib/ocr-utils";
import type { OcrItem } from "@/lib/store";

export default function OcrSection({
  items,
  patterns,
}: Readonly<{ items: OcrItem[]; patterns: Pattern[] }>) {
  return (
    <div className="rounded-xl border border-green-100 bg-white/70 p-4">
      <SectionHeader
        icon={<PanelsTopLeft className="h-4 w-4 text-green-700" />}
        title="OCR"
      />
      <Separator className="my-3" />
      <div className="max-h-56 overflow-y-auto space-y-1.5">
        {items.map((item) => (
          <Badge
            key={item.id}
            variant="outline"
            className="text-base font-mono whitespace-pre-wrap py-1.5 px-2.5 block text-left w-full justify-start"
          >
            <HighlightedText text={item.text} patterns={patterns} />
          </Badge>
        ))}
      </div>
    </div>
  );
}
