"use client";

import ExpectedData from "@/components/ExpectedData";
import { ChevronDown, ChevronRight, Settings, Upload } from "lucide-react";
import { useState, type ReactNode } from "react";
import ImageSourcePanel from "../uploader/ImageSourcePanel";

/** Collapsible section: blue header + white body */
function Section({
  title,
  defaultOpen = true,
  children,
  icon,
}: Readonly<{
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
  icon?: ReactNode;
}>) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border shadow-sm overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left bg-green-50/80 dark:bg-green-900/30"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium"> {title} </span>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 opacity-70" />
        ) : (
          <ChevronRight className="h-4 w-4 opacity-70" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 bg-white dark:bg-background">
          {children}
        </div>
      )}
    </div>
  );
}

export default function LeftSidebar() {
  return (
    <aside className="lg:sticky lg:top-6 self-start col-span-12 lg:col-span-4 space-y-4">
      <Section
        title="Configuración del lote"
        defaultOpen
        icon={<Settings className="h-4 w-4 text-slate-500" />}
      >
        <ExpectedData />
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
