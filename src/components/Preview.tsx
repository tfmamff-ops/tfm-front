"use client";

import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

export default function Preview() {
  const imagePreview = useAppStore((s) => s.imagePreview);
  const imageSource = useAppStore((s) => s.imageSource);

  return (
    <div className="relative rounded-2xl border p-3 min-h-[260px] flex items-center justify-center bg-muted/30">
      <div className="absolute top-1">
        <Badge variant="secondary" className="uppercase">
          {imageSource === "camera" ? "Cámara" : "Archivo"}
        </Badge>
      </div>

      {imagePreview ? (
        <img
          src={imagePreview}
          alt="preview"
          className="max-h-[360px] object-contain rounded-xl"
        />
      ) : (
        <span className="text-sm text-muted-foreground">
          No hay imagen seleccionada
        </span>
      )}
    </div>
  );
}
