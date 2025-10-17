"use client";

import Section from "@/components/ui/Section";
import ExpectedData from "@/components/ExpectedData";
import ImageSourcePanel from "@/components/uploader/ImageSourcePanel";
import { BarChart3, Settings, Upload } from "lucide-react";
import StatusSummary from "../StatusSummary";

export default function LeftSidebar() {
  return (
    <aside className="lg:sticky lg:top-6 self-start col-span-12 lg:col-span-4 space-y-4">
      <Section
        title="Configuración"
        defaultOpen
        icon={<Settings className="h-4 w-4 text-slate-500" />}
      >
        <ExpectedData />
      </Section>

      <Section
        title="Estado"
        defaultOpen
        icon={<BarChart3 className="h-4 w-4 text-slate-500" />}
      >
        <StatusSummary />
      </Section>

      <Section
        title="Imagen"
        defaultOpen
        icon={<Upload className="h-4 w-4 text-slate-500" />}
      >
        <ImageSourcePanel />
      </Section>
    </aside>
  );
}
