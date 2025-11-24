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
  const expectedData = useAppStore((s) => s.expectedData);
  const loading = useAppStore((s) => s.loading);
  const reportLoading = useAppStore((s) => s.reportLoading);

  const isDisabledConfig = loading === true || reportLoading === true;
  const hasAllExpectedValues =
    !!expectedData.prodDesc &&
    !!expectedData.lot &&
    !!expectedData.packDate &&
    !!expectedData.expDate;
  const isDisabledProcessing = !imagePreview || !hasAllExpectedValues;
  let processingDisabledMessage: string | null = null;
  if (isDisabledProcessing) {
    if (imagePreview) {
      processingDisabledMessage =
        "Seleccione una línea de producción para habilitar el proceso.";
    } else {
      processingDisabledMessage =
        "Agregue una imagen antes de iniciar el proceso.";
    }
  }

  return (
    <TooltipProvider>
      <Tabs defaultValue="config" className="w-full">
        <TabsList className="flex w-full max-w-lg mx-auto rounded-xl bg-white border border-green-100 shadow-sm p-1 gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex-1 min-w-0">
                <TabsTrigger
                  value="config"
                  disabled={isDisabledConfig}
                  className={`flex w-full items-center justify-center gap-1 md:gap-2 px-3 py-2 md:px-6 md:py-3 rounded-lg text-[11px] sm:text-xs md:text-base font-semibold text-center leading-tight whitespace-normal break-words transition-all duration-200
                    data-[state=active]:bg-green-50 data-[state=active]:shadow data-[state=active]:border-green-300 data-[state=active]:text-green-900
                    data-[state=inactive]:text-slate-500
                    ${
                      isDisabledConfig
                        ? "opacity-50 cursor-not-allowed pointer-events-none"
                        : ""
                    }`}
                >
                  <Settings className="h-4 w-4 md:h-5 md:w-5 mr-1 shrink-0" />
                  <span className="md:hidden">Config</span>
                  <span className="hidden md:inline">Configuración</span>
                </TabsTrigger>
              </div>
            </TooltipTrigger>
            {isDisabledConfig && (
              <TooltipContent>No disponible durante el proceso</TooltipContent>
            )}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex-1 min-w-0">
                <TabsTrigger
                  value="processing"
                  disabled={isDisabledProcessing}
                  className={`flex w-full items-center justify-center gap-1 md:gap-2 px-3 py-2 md:px-6 md:py-3 rounded-lg text-[11px] sm:text-xs md:text-base font-semibold text-center leading-tight whitespace-normal break-words transition-all duration-200
                    data-[state=active]:bg-green-50 data-[state=active]:shadow data-[state=active]:border-green-300 data-[state=active]:text-green-900
                    data-[state=inactive]:text-slate-500
                    ${
                      isDisabledProcessing
                        ? "opacity-50 cursor-not-allowed pointer-events-none"
                        : ""
                    }`}
                >
                  <Cpu className="h-4 w-4 md:h-5 md:w-5 mr-1 shrink-0" />
                  <span className="md:hidden">Proceso</span>
                  <span className="hidden md:inline">Procesamiento</span>
                </TabsTrigger>
              </div>
            </TooltipTrigger>
            {processingDisabledMessage && (
              <TooltipContent>{processingDisabledMessage}</TooltipContent>
            )}
          </Tooltip>
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
