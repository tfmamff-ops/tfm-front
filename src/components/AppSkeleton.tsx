"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function AppSkeleton() {
  return (
    <div className="w-full space-y-6">
      {/* Tab navigation skeleton */}
      <div className="flex w-full max-w-lg mx-auto rounded-xl bg-white border border-green-100 shadow-sm p-1 gap-2">
        <Skeleton className="flex-1 h-12 rounded-lg" />
        <Skeleton className="flex-1 h-12 rounded-lg" />
      </div>

      {/* Main content area */}
      <div className="space-y-4">
        {/* Section 1: Production line or Configured data */}
        <div className="rounded-2xl border bg-white shadow-md">
          <div className="flex items-center justify-between rounded-t-2xl border-b bg-green-50/80 px-4 py-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
          <div className="p-4 space-y-3">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </div>
        </div>

        {/* Section 2: Image source or Status */}
        <div className="rounded-2xl border bg-white shadow-md">
          <div className="flex items-center justify-between rounded-t-2xl border-b bg-green-50/80 px-4 py-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <Skeleton className="flex-1 h-10 rounded-lg" />
              <Skeleton className="flex-1 h-10 rounded-lg" />
            </div>
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        {/* Preview image skeleton */}
        <div className="rounded-2xl border bg-white shadow-md overflow-hidden">
          <Skeleton className="h-[300px] w-full" />
        </div>

        {/* Action button skeleton */}
        <Skeleton className="h-12 w-full rounded-xl" />

        {/* Processing results (optional cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border bg-white shadow-md">
            <div className="border-b bg-green-50/80 px-4 py-3">
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
          <div className="rounded-2xl border bg-white shadow-md">
            <div className="border-b bg-green-50/80 px-4 py-3">
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
