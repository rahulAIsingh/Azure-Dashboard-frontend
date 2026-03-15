import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, AlertTriangle, TrendingUp, IndianRupee, X, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { CostRecord } from "@/types/dashboardTypes";
import type { BudgetAlert } from "@/components/dashboard/BudgetAlerts";
import { format, subDays } from "date-fns";

interface NotificationItem {
  id: string;
  type: "budget" | "anomaly" | "forecast";
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationBellProps {
  budgets: BudgetAlert[];
  records: CostRecord[];
  getCostForScope: (scope: string, value: string) => number;
  onNavigateToAlerts: () => void;
}

const severityConfig = {
  critical: {
    bg: "bg-destructive/10",
    border: "border-destructive/20",
    icon: "text-destructive",
    dot: "bg-destructive",
  },
  warning: {
    bg: "bg-chart-4/10",
    border: "border-chart-4/20",
    icon: "text-chart-4",
    dot: "bg-chart-4",
  },
  info: {
    bg: "bg-primary/10",
    border: "border-primary/20",
    icon: "text-primary",
    dot: "bg-primary",
  },
};

export function NotificationBell({ budgets, records, getCostForScope, onNavigateToAlerts }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];
    const now = new Date();

    // Budget alerts
    budgets.forEach((b) => {
      const spent = getCostForScope(b.scope, b.scopeValue);
      const pct = (spent / b.budget) * 100;

      if (pct >= 100) {
        items.push({
          id: `budget-over-${b.id}`,
          type: "budget",
          severity: "critical",
          title: `${b.name} exceeded`,
          description: `Spent ₹${spent.toFixed(0)} of ₹${b.budget.toFixed(0)} budget (${pct.toFixed(0)}%)`,
          timestamp: new Date(now.getTime() - Math.random() * 3600000),
          read: false,
        });
      } else if (pct >= b.alertAt) {
        items.push({
          id: `budget-warn-${b.id}`,
          type: "budget",
          severity: "warning",
          title: `${b.name} at ${pct.toFixed(0)}%`,
          description: `₹${spent.toFixed(0)} of ₹${b.budget.toFixed(0)} — threshold is ${b.alertAt}%`,
          timestamp: new Date(now.getTime() - Math.random() * 7200000),
          read: false,
        });
      }
    });

    // Anomaly detection from recent records
    const last7 = records.filter((r) => r.usageDate >= format(subDays(now, 7), "yyyy-MM-dd"));
    const prev7 = records.filter(
      (r) => r.usageDate >= format(subDays(now, 14), "yyyy-MM-dd") && r.usageDate < format(subDays(now, 7), "yyyy-MM-dd")
    );

    const rgCostRecent = new Map<string, number>();
    const rgCostPrev = new Map<string, number>();
    last7.forEach((r) => rgCostRecent.set(r.resourceGroup, (rgCostRecent.get(r.resourceGroup) || 0) + r.cost));
    prev7.forEach((r) => rgCostPrev.set(r.resourceGroup, (rgCostPrev.get(r.resourceGroup) || 0) + r.cost));

    rgCostRecent.forEach((cost, rg) => {
      const prev = rgCostPrev.get(rg) || 0;
      if (prev > 0) {
        const change = ((cost - prev) / prev) * 100;
        if (change > 30) {
          items.push({
            id: `anomaly-${rg}`,
            type: "anomaly",
            severity: change > 60 ? "critical" : "warning",
            title: `${rg} spike detected`,
            description: `+${change.toFixed(0)}% cost increase over last 7 days (₹${cost.toFixed(0)} vs ₹${prev.toFixed(0)})`,
            timestamp: new Date(now.getTime() - Math.random() * 14400000),
            read: false,
          });
        }
      }
    });

    // Forecast warning
    const totalRecent = Array.from(rgCostRecent.values()).reduce((s, v) => s + v, 0);
    const projectedMonthly = (totalRecent / 7) * 30;
    if (projectedMonthly > 15000) {
      items.push({
        id: "forecast-high",
        type: "forecast",
        severity: "info",
        title: "High projected spend",
        description: `Projected monthly: ₹${projectedMonthly.toFixed(0)} based on current 7-day trend`,
        timestamp: new Date(now.getTime() - 1800000),
        read: false,
      });
    }

    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [budgets, records, getCostForScope]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const markRead = (id: string) => {
    setReadIds((prev) => new Set([...prev, id]));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "budget": return IndianRupee;
      case "anomaly": return AlertTriangle;
      case "forecast": return TrendingUp;
      default: return Bell;
    }
  };

  const timeAgo = (date: Date) => {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 sm:w-96 p-0 overflow-hidden" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground hover:text-foreground" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications list */}
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((n, i) => {
                const Icon = getIcon(n.type);
                const config = severityConfig[n.severity];
                const isRead = readIds.has(n.id);

                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 hover:bg-muted/40 ${!isRead ? "bg-primary/[0.02]" : ""
                      }`}
                    onClick={() => markRead(n.id)}
                  >
                    <div className={`mt-0.5 w-8 h-8 rounded-lg ${config.bg} border ${config.border} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-3.5 w-3.5 ${config.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-tight ${!isRead ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                          {n.title}
                        </p>
                        {!isRead && <div className={`w-2 h-2 rounded-full ${config.dot} shrink-0 mt-1`} />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.description}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-2.5 w-2.5 text-muted-foreground/60" />
                        <span className="text-[10px] text-muted-foreground/60">{timeAgo(n.timestamp)}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-border/40 px-4 py-2.5">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center gap-1.5 text-xs h-7 text-primary hover:text-primary font-semibold"
              onClick={() => { onNavigateToAlerts(); setOpen(false); }}
            >
              View all alerts
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
