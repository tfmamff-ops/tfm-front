"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function AppSkeleton() {
  return (
    <div className="container mx-auto p-6 grid grid-cols-12 gap-6">
      {/* Left column (filters / selects) */}
      <section className="col-span-12 lg:col-span-4 space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-32" />
      </section>

      {/* Center (image preview / results) */}
      <section className="col-span-12 lg:col-span-8 space-y-4">
        <Skeleton className="h-[260px] w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </section>

      {/* Bottom (history table) */}
      <section className="col-span-12">
        <Skeleton className="h-8 w-48 mb-2" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </section>
    </div>
  );
}
