type CompressOpts = {
  maxWidth?: number; // ancho máximo
  maxHeight?: number; // alto máximo
  quality?: number; // 0..1 (solo JPEG/WebP)
  format?: "image/jpeg" | "image/png" | "image/webp";
  targetMaxBytes?: number; // si querés limitar tamaño final (opcional)
};

async function fileToBitmap(file: File): Promise<ImageBitmap> {
  // Usa EXIF orientation si el navegador lo soporta (Chrome/Edge/Firefox modernos)
  try {
    // @ts-ignore - createImageBitmap tiene options en browser
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Fallback sin orientation si el browser no soporta la opción
    // (en la mayoría de los casos modernos no se ejecuta este branch)
    // Para un fallback total, usar <img> + onload.
    return await createImageBitmap(file);
  }
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob null"))),
      type,
      quality
    );
  });
}

/**
 * Reduce resolución manteniendo proporción y comprime.
 * Devuelve un File nuevo (para subir/guardar) y una URL de preview.
 */
export async function compressImageFile(
  file: File,
  {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.82,
    format,
    targetMaxBytes,
  }: CompressOpts = {}
): Promise<{ file: File; previewUrl: string; width: number; height: number }> {
  const bitmap = await fileToBitmap(file);

  // calcular escala manteniendo aspecto
  const { width, height } = bitmap;
  const scale = Math.min(maxWidth / width, maxHeight / height, 1); // nunca agrandar
  const outW = Math.round(width * scale);
  const outH = Math.round(height * scale);

  const canvas = makeCanvas(outW, outH);
  const ctx = canvas.getContext("2d", { alpha: true })!;
  // activar algo de suavizado
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, outW, outH);

  // decidir formato de salida
  // - si entra PNG y querés preservar transparencia, quedate en PNG
  // - si es foto (jpg), conviene JPEG para comprimir
  const outType =
    format ??
    (file.type === "image/png" && scale === 1
      ? "image/png"
      : file.type === "image/png"
      ? "image/jpeg" // convertir PNG a JPEG cuando reducimos (mejor tamaño)
      : file.type || "image/jpeg");

  let q =
    outType === "image/jpeg" || outType === "image/webp" ? quality : undefined;
  let blob = await canvasToBlob(canvas, outType, q);

  // si pediste un tamaño máximo en bytes, iteramos bajando quality
  if (
    targetMaxBytes &&
    (outType === "image/jpeg" || outType === "image/webp")
  ) {
    while (blob.size > targetMaxBytes && (q ?? 1) > 0.5) {
      q = Math.max(0.5, (q ?? 0.82) - 0.07);
      blob = await canvasToBlob(canvas, outType, q);
    }
  }

  const outName = (() => {
    const ext =
      outType === "image/png"
        ? ".png"
        : outType === "image/webp"
        ? ".webp"
        : ".jpg";
    const base = file.name.replace(/\.[^.]+$/, "");
    return `${base}_compressed${ext}`;
  })();

  const outFile = new File([blob], outName, {
    type: outType,
    lastModified: Date.now(),
  });
  const previewUrl = URL.createObjectURL(blob);

  return { file: outFile, previewUrl, width: outW, height: outH };
}
