import { LucideIcon, Inbox } from "lucide-react";

interface EmptyStateProps {
  message?: string;
  description?: string;
  icon?: LucideIcon;
}

export function EmptyState({
  message = "No cost data available for selected filters",
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
