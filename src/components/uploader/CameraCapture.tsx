"use client";

import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { useAppStore } from "@/lib/store";
import { compressImageFile } from "@/lib/image";

export default function CameraCapture() {
  const ref = useRef<Webcam>(null);
  const { setFile, setPreview } = useAppStore();

  const snap = async () => {
    const dataUrl = ref.current?.getScreenshot();
    if (!dataUrl) return;
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const f = new File([blob], "captura.jpg", { type: blob.type });

    // achicar + comprimir antes de guardarlo
    const { file: compact, previewUrl } = await compressImageFile(f, {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.82, // solo aplica a JPEG/WebP
    });

    setFile(compact);
    setPreview(previewUrl);
  };

  return (
    <div className="space-y-3">
      <Webcam
        ref={ref}
        screenshotFormat="image/jpeg"
        className="rounded-2xl border"
        videoConstraints={{ facingMode: "environment" }}
      />
      <Button onClick={snap}>Tomar foto</Button>
    </div>
  );
}
