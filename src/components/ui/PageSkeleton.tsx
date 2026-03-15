import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3.5 w-32" />
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card-elevated p-3.5 sm:p-5 space-y-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="glass-card p-5 h-[300px] flex flex-col gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="flex-1 w-full rounded-lg" />
        </div>
        <div className="glass-card p-5 h-[300px] flex flex-col gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="flex-1 w-full rounded-lg" />
        </div>
      </div>

      <div className="glass-card p-5 h-[350px] flex flex-col gap-3">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="flex-1 w-full rounded-lg" />
      </div>
    </div>
  );
}
