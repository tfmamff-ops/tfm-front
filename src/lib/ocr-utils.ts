export type OcrItem = { id: string; text: string };

export function buildOcrItems(lines: string[]): OcrItem[] {
  return lines.map((text, idx) => ({ id: String(idx), text }));
}

// Human-friendly descriptions for common barcode symbologies
const SYMBOLOGY_DESCRIPTIONS: Record<string, string> = {
  QR: "QR Code",
  EAN13: "EAN-13 (retail)",
  EAN8: "EAN-8 (retail)",
  CODE128: "Code 128 (alfanumérico)",
  CODE39: "Code 39",
  PDF417: "PDF417",
  DATAMATRIX: "Data Matrix",
};

export function describeSymbology(symbology?: string): string | undefined {
  if (!symbology) return undefined;
  return SYMBOLOGY_DESCRIPTIONS[symbology] ?? undefined;
}
