"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export type SectionProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
  icon?: ReactNode;
};

export default function Section({
  title,
  defaultOpen = true,
  children,
  icon,
}: Readonly<SectionProps>) {
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
          <span className="font-medium">{title}</span>
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
