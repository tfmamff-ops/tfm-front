type CompressOpts = {
  maxWidth?: number; // max width
  maxHeight?: number; // max height
  quality?: number; // 0..1 (JPEG/WebP only)
  format?: "image/jpeg" | "image/png" | "image/webp";
  targetMaxBytes?: number; // if you want to limit final size (optional)
};

type CompressedImage = {
  file: File;
  previewUrl: string; // Remember to revoke with URL.revokeObjectURL(previewUrl) when done
  width: number;
  height: number;
};

async function fileToBitmap(file: File): Promise<ImageBitmap> {
  // Use EXIF orientation if the browser supports it (modern Chrome/Edge/Firefox)
  try {
    // createImageBitmap supports options like imageOrientation in browsers; TypeScript lib definitions may vary
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Fallback without orientation if the browser doesn't support the option
    // (in most modern cases this branch won't run)
    // For a fully compatible fallback, use <img> + onload.
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
 * Check if canvas has any transparency (alpha channel < 255)
 */
function hasAlphaChannel(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Sample every 10th pixel for performance (for very large images)
  for (let i = 3; i < data.length; i += 40) {
    if (data[i] < 255) return true;
  }
  return false;
}

/**
 * Reduce resolution while keeping aspect ratio and compresses it.
 * Returns a new File (for upload/storage) and a preview URL.
 *
 * IMPORTANT: Remember to call URL.revokeObjectURL(previewUrl) when you no longer need the URL
 * to avoid memory leaks (e.g., in a useEffect cleanup or when replacing the image).
 */
export async function compressImageFile(
  file: File,
  {
    maxWidth = 3040,
    maxHeight = 3040,
    quality,
    format,
    targetMaxBytes,
  }: CompressOpts = {}
): Promise<CompressedImage> {
  const bitmap = await fileToBitmap(file);

  // compute scale keeping aspect ratio
  const { width, height } = bitmap;
  const scale = Math.min(maxWidth / width, maxHeight / height, 1); // never upscale
  const outW = Math.round(width * scale);
  const outH = Math.round(height * scale);

  const canvas = makeCanvas(outW, outH);
  const ctx = canvas.getContext("2d", { alpha: true })!;
  // enable smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, outW, outH);

  // decide output format
  // - if input is PNG and you want to preserve transparency, stay in PNG
  // - if it's a photo (jpg), JPEG is better for compression
  let outType: string;
  if (format) {
    outType = format;
  } else if (file.type === "image/png") {
    // Check if PNG has transparency; if so, preserve it
    const hasAlpha = hasAlphaChannel(canvas);
    if (hasAlpha) {
      outType = "image/png"; // Preserve transparency
    } else if (scale === 1) {
      outType = "image/png"; // No downscaling, keep PNG
    } else {
      outType = "image/jpeg"; // Convert to JPEG for smaller size
    }
  } else if (file.type) {
    outType = file.type;
  } else {
    outType = "image/jpeg";
  }

  // Auto-adjust quality based on scale: higher quality for less downscaling
  const autoQuality = scale > 0.8 ? 0.9 : 0.82;
  let q =
    outType === "image/jpeg" || outType === "image/webp"
      ? quality ?? autoQuality
      : undefined;
  let blob = await canvasToBlob(canvas, outType, q);

  // if you requested a max size in bytes, iterate lowering quality (with a max of 10 attempts)
  if (
    targetMaxBytes &&
    (outType === "image/jpeg" || outType === "image/webp")
  ) {
    let attempts = 0;
    while (blob.size > targetMaxBytes && (q ?? 1) > 0.5 && attempts < 10) {
      q = Math.max(0.5, (q ?? autoQuality) - 0.07);
      blob = await canvasToBlob(canvas, outType, q);
      attempts++;
    }
  }

  const outName = (() => {
    let ext: string;
    if (outType === "image/png") {
      ext = ".png";
    } else if (outType === "image/webp") {
      ext = ".webp";
    } else {
      ext = ".jpg";
    }
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
