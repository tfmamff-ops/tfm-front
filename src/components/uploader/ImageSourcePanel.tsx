"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store";
import ImageUploader from "@/components/uploader/ImageUploader";
import CameraCapture from "@/components/uploader/CameraCapture";
import { Camera, Upload } from "lucide-react";

export default function ImageSourcePanel() {
  const { imageSource, setImageSource } = useAppStore();

  return (
    <div className="rounded-xl border bg-white dark:bg-background p-3">
      <Tabs
        value={imageSource}
        onValueChange={(v) => setImageSource(v as "upload" | "camera")}
      >
        <TabsList className="grid w-full grid-cols-2 bg-green-200/80">
          <TabsTrigger value="upload" className="text-xs md:text-sm gap-2">
            <Upload className="h-4 w-4" />
            <span className="inline md:hidden">Archivo</span>
            <span className="hidden md:inline">Subir archivo</span>
          </TabsTrigger>
          <TabsTrigger value="camera" className="text-xs md:text-sm gap-2">
            <Camera className="h-4 w-4" />
            Cámara
          </TabsTrigger>
        </TabsList>

        <div className="mt-3">
          <TabsContent value="upload">
            <ImageUploader />
            <p className="mt-2 text-xs text-muted-foreground">
              Acepta JPG/PNG hasta 10&nbsp;MB.
            </p>
          </TabsContent>
          <TabsContent value="camera">
            <CameraCapture />
            <p className="mt-2 text-xs text-muted-foreground">
              Permite acceso a la cámara del navegador.
            </p>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
