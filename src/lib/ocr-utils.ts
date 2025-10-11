export type OcrItem = { id: string; text: string };

export type Pattern = {
  value: string; // text to match
  className: string; // e.g. "bg-sky-200"
};

export type TextSegment = {
  text: string;
  highlighted: boolean;
  className?: string;
};

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function hashString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return `k${Math.abs(h)}`;
}

export function buildOcrItems(lines: string[]): OcrItem[] {
  const counters: Record<string, number> = {};
  return lines.map((text) => {
    const base = hashString(text);
    const n = (counters[base] = (counters[base] || 0) + 1);
    return { id: `${base}-${n}`, text };
  });
}

/** Split text into segments with highlight metadata (no JSX here). */
export function computeHighlightSegments(
  text: string,
  patterns: Pattern[]
): TextSegment[] {
  const actives = patterns
    .filter((p) => p.value && p.value.trim().length > 0)
    .map((p) => ({ ...p, lc: p.value.toLowerCase() }));

  if (actives.length === 0) return [{ text, highlighted: false }];

  const colorMap = new Map<string, string>();
  for (const p of actives) colorMap.set(p.lc, p.className);

  const combined = new RegExp(
    actives.map((p) => `(${escapeRegExp(p.value)})`).join("|"),
    "gi"
  );

  const out: TextSegment[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = combined.exec(text))) {
    const start = m.index;
    const end = combined.lastIndex;

    if (start > lastIndex) {
      out.push({ text: text.slice(lastIndex, start), highlighted: false });
    }

    const match = text.slice(start, end);
    const cls = colorMap.get(match.toLowerCase()) ?? "bg-yellow-200";
    out.push({ text: match, highlighted: true, className: cls });

    lastIndex = end;
  }

  if (lastIndex < text.length) {
    out.push({ text: text.slice(lastIndex), highlighted: false });
  }

  return out;
}
