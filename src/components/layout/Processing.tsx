"use client";

import { BarChart3 } from "lucide-react";
import ProcessingCard from "../ProcessingCard";
import Section from "@/components/ui/Section";
import ConfiguredValues from "../ConfiguredValues";
import StatusSummary from "../StatusSummary";
import SendToAzureButton from "../uploader/SendToAzureButton";
import Preview from "../Preview";

export default function Processing() {
  return (
    <aside className="lg:sticky lg:top-6 self-start col-span-12 lg:col-span-4 space-y-4">
      <ConfiguredValues />
      <Section
        title="Estado"
        defaultOpen
        icon={<BarChart3 className="h-4 w-4 text-slate-500" />}
      >
        <StatusSummary />
      </Section>
      <Preview />
      <SendToAzureButton />
      <ProcessingCard />
    </aside>
  );
}
