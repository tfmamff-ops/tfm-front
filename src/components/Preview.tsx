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
          {imageSource === "camera" ? "Origen: Cámara" : "Origen: Archivo"}
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

//pnpm add react-image-crop
// "use client";

// import { useRef, useState } from "react";
// import ReactCrop, { type Crop } from "react-image-crop";
// import { useAppStore } from "@/lib/store";
// import { Badge } from "@/components/ui/badge";
// import "react-image-crop/dist/ReactCrop.css";

// export default function Preview() {
//   const imagePreview = useAppStore((s) => s.imagePreview);
//   const imageSource = useAppStore((s) => s.imageSource);

//   const imgRef = useRef<HTMLImageElement | null>(null);
//   const [crop, setCrop] = useState<Crop>({
//     unit: "%", // porcentual para que sea responsivo
//     x: 10,
//     y: 10,
//     width: 60,
//     height: 30,
//   });

//   function onImageLoaded(img: HTMLImageElement) {
//     imgRef.current = img;
//   }

//   function onComplete(c: Crop) {
//     const img = imgRef.current;
//     if (!img || !c.width || !c.height) return;

//     // tamaño mostrado en pantalla
//     const showW = img.clientWidth;
//     const showH = img.clientHeight;

//     // crop viene en % → pasamos a px mostrados
//     const pxShown = {
//       x: Math.round(((c.x ?? 0) / 100) * showW),
//       y: Math.round(((c.y ?? 0) / 100) * showH),
//       width: Math.round(((c.width ?? 0) / 100) * showW),
//       height: Math.round(((c.height ?? 0) / 100) * showH),
//     };

//     // pasamos a píxeles “naturales” (de la imagen original)
//     const scaleX = img.naturalWidth / showW;
//     const scaleY = img.naturalHeight / showH;

//     const roiPxNat = {
//       x: Math.round(pxShown.x * scaleX),
//       y: Math.round(pxShown.y * scaleY),
//       width: Math.round(pxShown.width * scaleX),
//       height: Math.round(pxShown.height * scaleY),
//     };

//     // opcional: ROI normalizada 0..1
//     const roiNorm = {
//       x: roiPxNat.x / img.naturalWidth,
//       y: roiPxNat.y / img.naturalHeight,
//       width: roiPxNat.width / img.naturalWidth,
//       height: roiPxNat.height / img.naturalHeight,
//     };

//     console.log("ROI (px originales):", roiPxNat);
//     console.log("ROI (normalizada 0..1):", roiNorm);
//   }

//   return (
//     <div className="relative rounded-2xl border p-3 min-h-[260px] flex items-center justify-center bg-muted/30">
//       <div className="absolute top-1">
//         <Badge variant="secondary" className="uppercase">
//           {imageSource === "camera" ? "Cámara" : "Archivo"}
//         </Badge>
//       </div>

//       {imagePreview ? (
//         <div className="max-h-[360px]">
//           <ReactCrop
//             crop={crop}
//             onChange={setCrop}
//             onComplete={onComplete}
//             keepSelection
//           >
//             <img
//               src={imagePreview}
//               alt="preview"
//               ref={imgRef}
//               onLoad={(e) => onImageLoaded(e.currentTarget)}
//               className="max-h-[360px] object-contain rounded-xl"
//               draggable={false}
//             />
//           </ReactCrop>
//         </div>
//       ) : (
//         <span className="text-sm text-muted-foreground">
//           No hay imagen seleccionada
//         </span>
//       )}
//     </div>
//   );
// }
