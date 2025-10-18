"use client";

import Configuration from "@/components/layout/Configuration";
import Processing from "@/components/layout/Processing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store";
import { Cpu, Settings } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Page() {
  const imagePreview = useAppStore((s) => s.imagePreview);
  const ocrLoading = useAppStore((s) => s.ocr.loading);

  return (
    <TooltipProvider>
      <Tabs defaultValue="config" className="w-full">
        <TabsList className="flex w-full max-w-lg mx-auto rounded-xl bg-white border border-green-100 shadow-sm p-1 gap-2">
          {(() => {
            const isDisabledConfig = ocrLoading === true;
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1">
                    <TabsTrigger
                      value="config"
                      disabled={isDisabledConfig}
                      className={`flex w-full items-center justify-center gap-2 px-6 py-3 rounded-lg text-xs md:text-base font-semibold transition-all duration-200
                        data-[state=active]:bg-green-50 data-[state=active]:shadow data-[state=active]:border-green-300 data-[state=active]:text-green-900
                        data-[state=inactive]:text-slate-500
                        ${
                          isDisabledConfig
                            ? "opacity-50 cursor-not-allowed pointer-events-none"
                            : ""
                        }`}
                    >
                      <Settings className="h-5 w-5 mr-1" />
                      Configuración
                    </TabsTrigger>
                  </div>
                </TooltipTrigger>
                {isDisabledConfig && (
                  <TooltipContent>
                    No se puede editar la configuración durante el
                    procesamiento.
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })()}
          {(() => {
            const isDisabled = !imagePreview;
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1">
                    <TabsTrigger
                      value="processing"
                      disabled={isDisabled}
                      className={`flex w-full items-center justify-center gap-2 px-6 py-3 rounded-lg text-xs md:text-base font-semibold transition-all duration-200
                        data-[state=active]:bg-green-50 data-[state=active]:shadow data-[state=active]:border-green-300 data-[state=active]:text-green-900
                        data-[state=inactive]:text-slate-500
                        ${
                          isDisabled
                            ? "opacity-50 cursor-not-allowed pointer-events-none"
                            : ""
                        }`}
                    >
                      <Cpu className="h-5 w-5 mr-1" />
                      Procesamiento
                    </TabsTrigger>
                  </div>
                </TooltipTrigger>
                {isDisabled && (
                  <TooltipContent>
                    Suba una imagen para habilitar el procesamiento.
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })()}
        </TabsList>

        <TabsContent value="config" className="space-y-6 mt-6">
          <Configuration />
        </TabsContent>

        <TabsContent value="processing" className="space-y-6 mt-6">
          <Processing />
        </TabsContent>
      </Tabs>
    </TooltipProvider>
  );
}
