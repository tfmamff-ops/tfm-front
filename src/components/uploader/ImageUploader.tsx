"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export default function ImageUploader() {
  const { setFile, setPreview } = useAppStore();
  const [error, setError] = useState<string>("");

  const onDropAccepted = useCallback(
    (accepted: File[]) => {
      setError("");
      const f = accepted[0];
      if (!f) return;
      setFile(f);
      setPreview(URL.createObjectURL(f));
    },
    [setFile, setPreview]
  );

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    // Build a friendly error message
    const reasons = new Set<string>();
    for (const r of rejections) {
      for (const e of r.errors) {
        if (e.code === "file-invalid-type") {
          reasons.add("Solo se permite JPG o PNG.");
        } else if (e.code === "file-too-large") {
          reasons.add("El tamaño máximo del archivo es 10MB.");
        } else {
          reasons.add(e.message);
        }
      }
    }
    setError([...reasons].join(" "));
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject, open } =
    useDropzone({
      accept: { "image/jpeg": [], "image/png": [] },
      maxSize: MAX_SIZE,
      multiple: false,
      onDropAccepted,
      onDropRejected,
      // Desactivar el click en el área para que solo el botón dispare el selector
      noClick: true,
    });

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={[
          "rounded-2xl border border-dashed p-6 text-center transition",
          isDragActive && !isDragReject ? "bg-muted" : "",
          isDragReject ? "border-destructive/50 bg-destructive/5" : "",
        ].join(" ")}
      >
        <input
          {...getInputProps()}
          // Extra hint for native file picker
          accept="image/jpeg,image/png"
          className="hidden"
        />
        <p className="mb-2 text-sm">
          {isDragActive
            ? "Suelte la imagen…"
            : "Arrastre y suelte una imagen aquí"}
        </p>
        <Button variant="secondary" type="button" onClick={() => open()}>
          Elegir del sistema
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
