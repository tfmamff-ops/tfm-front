"use client";

import { Badge } from "@/components/ui/badge";

export default function BoolBadge({ value }: Readonly<{ value: boolean }>) {
  return (
    <Badge
      variant="outline"
      className={
        value
          ? "border-green-300 bg-green-50 text-green-700"
          : "border-slate-300 bg-slate-50 text-slate-600"
      }
    >
      {value ? "Sí" : "No"}
    </Badge>
  );
}
