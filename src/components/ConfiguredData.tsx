"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Factory } from "lucide-react";
import DataDetail from "./DataDetail";

export default function ConfiguredData() {
  return (
    <Card className="rounded-2xl border shadow-md bg-gradient-to-b from-white to-green-50/40 py-0">
      <CardContent className="p-0">
        {/* Accent header */}
        <div className="flex items-center justify-between rounded-t-2xl border-b bg-green-50/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <Factory className="h-4 w-4 text-green-700" aria-hidden="true" />
            <h3 className="text-xs md:text-sm font-semibold tracking-tight text-green-900">
              Producto
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <DataDetail />
        </div>
      </CardContent>
    </Card>
  );
}
