import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface ChartLoadingProps {
  height?: string;
}

export function ChartLoading({ height = "h-[300px]" }: ChartLoadingProps) {
  return (
    <div className={`glass-card p-5 ${height} flex flex-col gap-3`}>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="flex-1 w-full rounded-lg" />
    </div>
  );
}

export function KpiLoading() {
  return (
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
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Failed to load data", onRetry }: ErrorStateProps) {
  return (
    <div className="glass-card p-8 flex flex-col items-center justify-center gap-3 text-center">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <p className="text-sm font-medium text-foreground">{message}</p>
      <p className="text-xs text-muted-foreground max-w-sm">
        Please check your connection or try again. If the problem persists, the API may be unavailable.
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="gap-1.5 mt-2" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  message?: string;
  description?: string;
  icon?: LucideIcon;
}

export function EmptyState({
  message = "No cost data available",
  description = "Try adjusting your filters or date range.",
  icon: Icon = Inbox,
}: EmptyStateProps) {
  return (
    <div className="glass-card p-10 flex flex-col items-center justify-center gap-3 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{message}</p>
      <p className="text-xs text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}
