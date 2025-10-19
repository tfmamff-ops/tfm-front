"use client";

import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import Image from "next/image";

export default function Preview() {
  const imagePreview = useAppStore((s) => s.imagePreview);
  const imageSource = useAppStore((s) => s.imageSource);
  const filename = useAppStore((s) => s.filename);

  return (
    <div className="relative rounded-2xl border p-3 min-h-[260px] flex items-center justify-center bg-muted/30">
      <div className="absolute top-1">
        <Badge variant="secondary" className="uppercase">
          {imageSource === "camera" ? "Cámara" : "Archivo"}
          {filename ? ` - ${filename}` : ""}
        </Badge>
      </div>

      {imagePreview ? (
        <Image
          src={imagePreview}
          alt="Vista previa de la imagen seleccionada"
          width={800}
          height={600}
          className="max-h-[360px] w-auto object-contain rounded-xl"
          unoptimized
        />
      ) : (
        <span className="text-sm text-muted-foreground">
          No hay imagen seleccionada
        </span>
      )}
    </div>
  );
}
