"use client";

import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { useAppStore } from "@/lib/store";

export default function CameraCapture() {
  const ref = useRef<Webcam>(null);
  const { setFile, setPreview } = useAppStore();

  const snap = async () => {
    const dataUrl = ref.current?.getScreenshot();
    if (!dataUrl) return;
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const f = new File([blob], "captura.jpg", { type: blob.type });
    setFile(f);
    setPreview(URL.createObjectURL(f));
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
