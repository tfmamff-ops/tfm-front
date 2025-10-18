"use client";

import { Badge } from "@/components/ui/badge";

export default function BoolBadge({ value }: Readonly<{ value: boolean }>) {
  return (
    <Badge
      variant="outline"
      className={
        value
          ? "border-green-300 bg-green-50 text-green-700"
          : "border-rose-300 bg-rose-50 text-rose-600"
      }
    >
      {value ? "Sí" : "No"}
    </Badge>
  );
}
