import { useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, AlertTriangle, TrendingUp, TrendingDown, IndianRupee, Server } from "lucide-react";
import { formatINR } from "@/lib/currency";
import type { CostRecord } from "@/types/dashboardTypes";
import { format, parseISO, differenceInHours } from "date-fns";

interface ActivityTimelineProps {
  records: CostRecord[];
}

type EventType = "spike" | "drop" | "new_resource" | "threshold" | "anomaly";

interface TimelineEvent {
  id: string;
  date: string;
  type: EventType;
  title: string;
  description: string;
  amount?: number;
}

const eventConfig: Record<EventType, { icon: typeof AlertTriangle; color: string; bgColor: string }> = {
  spike: { icon: TrendingUp, color: "text-destructive", bgColor: "bg-destructive/10" },
  drop: { icon: TrendingDown, color: "text-kpi-up", bgColor: "bg-kpi-up/10" },
  new_resource: { icon: Server, color: "text-primary", bgColor: "bg-primary/10" },
  threshold: { icon: AlertTriangle, color: "text-chart-4", bgColor: "bg-chart-4/10" },
  anomaly: { icon: IndianRupee, color: "text-chart-3", bgColor: "bg-chart-3/10" },
};

export function ActivityTimeline({ records }: ActivityTimelineProps) {
  const events = useMemo<TimelineEvent[]>(() => {
    // Build daily totals
    const dailyCosts = new Map<string, number>();
    records.forEach((r) => {
      dailyCosts.set(r.usageDate, (dailyCosts.get(r.usageDate) || 0) + r.cost);
    });

    const sortedDays = Array.from(dailyCosts.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    const result: TimelineEvent[] = [];
    let id = 0;

    // Detect spikes and drops
    for (let i = 0; i < sortedDays.length - 1 && result.length < 8; i++) {
      const [date, cost] = sortedDays[i];
      const [, prevCost] = sortedDays[i + 1];
      const change = ((cost - prevCost) / prevCost) * 100;

      if (change > 15) {
        result.push({
          id: String(id++),
          date,
          type: "spike",
          title: "Cost Spike Detected",
          description: `Daily cost increased by ${change.toFixed(1)}% (${formatINR(cost - prevCost, 0)})`,
          amount: cost,
        });
      } else if (change < -15) {
        result.push({
          id: String(id++),
          date,
          type: "drop",
          title: "Cost Reduction",
          description: `Daily cost decreased by ${Math.abs(change).toFixed(1)}% (-${formatINR(Math.abs(cost - prevCost), 0)})`,
          amount: cost,
        });
      }
    }

    // Add some synthetic events
    if (sortedDays.length > 0) {
      result.push({
        id: String(id++),
        date: sortedDays[0][0],
        type: "threshold",
        title: "Budget Threshold Alert",
        description: "Production-Sub reached 80% of monthly budget",
      });

      if (sortedDays.length > 3) {
        result.push({
          id: String(id++),
          date: sortedDays[3][0],
          type: "anomaly",
          title: "Unusual Spending Pattern",
          description: "aks-prod-cluster cost 2.3x above 7-day average",
          amount: 57.50,
        });
      }

      if (sortedDays.length > 5) {
        result.push({
          id: String(id++),
          date: sortedDays[5][0],
          type: "new_resource",
          title: "New Resource Detected",
          description: "redis-prod added to Prod-RG subscription",
        });
      }
    }

    return result.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  }, [records]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-elevated p-4 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground text-sm sm:text-base">Activity Timeline</h3>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[15px] sm:left-[17px] top-2 bottom-2 w-px bg-border" />

        <div className="space-y-1">
          {events.map((event, i) => {
            const config = eventConfig[event.type];
            const Icon = config.icon;
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors relative"
              >
                <div className={`w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-full ${config.bgColor} flex items-center justify-center shrink-0 z-10`}>
                  <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs sm:text-sm font-medium text-foreground">{event.title}</span>
                    {event.amount && (
                      <span className="text-xs font-semibold text-foreground">{formatINR(event.amount, 0)}</span>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{event.description}</p>
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground/70">
                    {format(parseISO(event.date), "MMM d, yyyy")}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
