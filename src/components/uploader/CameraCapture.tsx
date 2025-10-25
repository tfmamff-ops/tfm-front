"use client";

import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { compressImageFile } from "@/lib/image";

export default function CameraCapture() {
  const ref = useRef<Webcam>(null);
  const { setFile, setFilename, setPreview } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  const snap = async () => {
    const dataUrl = ref.current?.getScreenshot();
    if (!dataUrl) return;
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const f = new File([blob], "captura.jpg", { type: blob.type });

    // Downscale + compress before storing
    const { file: compact, previewUrl } = await compressImageFile(f);
    setFilename(f.name);
    setFile(compact);
    setPreview(previewUrl);
  };

  return (
    <div className="space-y-3 flex flex-col items-center">
      <div className="relative">
        <Webcam
          ref={ref}
          screenshotFormat="image/jpeg"
          className="rounded-2xl border"
          videoConstraints={{ facingMode: "environment" }}
          onUserMedia={() => setIsLoading(false)}
          onUserMediaError={() => setIsLoading(false)}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-2xl backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-green-600" />
              <p className="text-sm text-slate-200 font-medium">
                Iniciando cámara...
              </p>
            </div>
          </div>
        )}
      </div>
      <Button onClick={snap} disabled={isLoading}>
        Tomar foto
      </Button>
    </div>
  );
}
