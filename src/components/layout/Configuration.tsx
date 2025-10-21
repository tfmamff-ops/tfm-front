"use client";

import ExpectedData from "@/components/ExpectedData";
import Section from "@/components/ui/Section";
import ImageSourcePanel from "@/components/uploader/ImageSourcePanel";
import { Wrench } from "lucide-react";
import Preview from "../Preview";

export default function Configuration() {
  return (
    <aside className="lg:sticky lg:top-6 self-start col-span-12 lg:col-span-4 space-y-4">
      <Section
        title="Seleccione la línea de producción"
        defaultOpen
        icon={<Wrench className="h-4 w-4 text-green-700" />}
      >
        <ExpectedData />
      </Section>

      <Section
        title="Seleccione la fuente de la imagen"
        defaultOpen
        icon={<Wrench className="h-4 w-4 text-green-700" />}
      >
        <ImageSourcePanel />
      </Section>
      <Preview />
    </aside>
  );
}
