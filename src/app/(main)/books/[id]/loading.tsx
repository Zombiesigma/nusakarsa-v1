'use client';

import { Skeleton } from "@/components/ui/skeleton";

export default function BookDetailsLoading() {
  return (
    <div className="max-w-lg mx-auto p-6 space-y-10 animate-pulse">
      {/* Cover Skeleton */}
      <Skeleton className="aspect-[2/3] w-full rounded-[2.5rem] md:rounded-[3rem]" />
      
      {/* Title & Info Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-12 w-3/4 rounded-full" />
        <Skeleton className="h-6 w-1/2 rounded-full" />
      </div>
      
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-[2rem]" />
        <Skeleton className="h-24 rounded-[2rem]" />
        <Skeleton className="h-24 rounded-[2rem]" />
      </div>
      
      {/* Synopsis Skeleton */}
      <div className="space-y-4 pt-4">
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-4 w-3/4 rounded-full" />
      </div>
      
      {/* Button Skeleton */}
      <Skeleton className="h-16 w-full rounded-[2rem]" />
    </div>
  );
}
