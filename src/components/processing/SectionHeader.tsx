"use client";

import type React from "react";

export default function SectionHeader({
  icon,
  title,
}: Readonly<{ icon: React.ReactNode; title: React.ReactNode }>) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-green-900/80">
      {icon}
      {title}
    </div>
  );
}
