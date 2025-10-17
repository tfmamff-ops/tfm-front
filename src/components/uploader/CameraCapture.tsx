"use client";

import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { useAppStore } from "@/lib/store";
import { compressImageFile } from "@/lib/image";

export default function CameraCapture() {
  const ref = useRef<Webcam>(null);
  const { setFile, setFilename, setPreview } = useAppStore();

  const snap = async () => {
    const dataUrl = ref.current?.getScreenshot();
    if (!dataUrl) return;
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const f = new File([blob], "captura.jpg", { type: blob.type });

    // achicar + comprimir antes de guardarlo
    const { file: compact, previewUrl } = await compressImageFile(f);
    setFilename(f.name);
    setFile(compact);
    setPreview(previewUrl);
  };

  return (
    <div className="space-y-3 flex flex-col items-center">
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
