"use client";

import type { Pattern, TextSegment } from "@/lib/ocr-utils";
import { computeHighlightSegments } from "@/lib/ocr-utils";

export default function HighlightedText({
  text,
  patterns,
  className,
}: Readonly<{
  text: string;
  patterns: Pattern[];
  className?: string;
}>) {
  const segments: TextSegment[] = computeHighlightSegments(text, patterns);

  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.highlighted ? (
          <mark
            key={`${i}-${seg.text}-${seg.className}`}
            className={`${seg.className} px-1 rounded font-semibold`}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={`${i}-${seg.text}`}>{seg.text}</span>
        )
      )}
    </span>
  );
}
