import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import type { CostRecord } from "@/types/dashboardTypes";
import { format, parseISO, getDay } from "date-fns";

interface CostHeatmapProps {
  records: CostRecord[];
}

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getHeatColor(value: number, max: number): string {
  if (max === 0) return "hsl(var(--muted))";
  const ratio = value / max;
  if (ratio < 0.2) return "hsl(var(--primary) / 0.1)";
  if (ratio < 0.4) return "hsl(var(--primary) / 0.25)";
  if (ratio < 0.6) return "hsl(var(--primary) / 0.45)";
  if (ratio < 0.8) return "hsl(var(--primary) / 0.65)";
  return "hsl(var(--primary) / 0.9)";
}

export function CostHeatmap({ records }: CostHeatmapProps) {
  const heatmapData = useMemo(() => {
    // Group by day-of-week × week-number
    const dailyCosts = new Map<string, number>();
    records.forEach((r) => {
      dailyCosts.set(r.usageDate, (dailyCosts.get(r.usageDate) || 0) + r.cost);
    });

    const sortedDates = Array.from(dailyCosts.keys()).sort();
    const maxCost = Math.max(...dailyCosts.values());

    // Build weeks
    const weeks: { date: string; cost: number; day: number }[][] = [];
    let currentWeek: { date: string; cost: number; day: number }[] = [];

    sortedDates.forEach((date) => {
      const dayOfWeek = getDay(parseISO(date));
      const entry = { date, cost: dailyCosts.get(date) || 0, day: dayOfWeek };

      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(entry);
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return { weeks: weeks.slice(-8), maxCost }; // Last 8 weeks
  }, [records]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-elevated p-4 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Flame className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground text-sm sm:text-base">Spending Heatmap</h3>
        <span className="text-xs text-muted-foreground ml-auto">Last 8 weeks</span>
      </div>

      <div className="flex gap-2">
        {/* Day labels */}
        <div className="flex flex-col gap-1 pt-6">
          {dayLabels.map((d) => (
            <div key={d} className="h-5 sm:h-6 flex items-center text-[10px] sm:text-xs text-muted-foreground">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-1 min-w-fit">
            {heatmapData.weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                <div className="text-[9px] sm:text-[10px] text-muted-foreground text-center h-5 sm:h-5 flex items-end justify-center pb-0.5">
                  {week[0] ? format(parseISO(week[0].date), "MMM d") : ""}
                </div>
                {Array.from({ length: 7 }, (_, dayIdx) => {
                  const cell = week.find((c) => c.day === dayIdx);
                  return (
                    <div
                      key={dayIdx}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-sm cursor-default transition-transform hover:scale-110"
                      style={{ backgroundColor: cell ? getHeatColor(cell.cost, heatmapData.maxCost) : "hsl(var(--muted) / 0.3)" }}
                      title={cell ? `${cell.date}: $${cell.cost.toFixed(2)}` : "No data"}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 justify-end">
        <span className="text-[10px] text-muted-foreground">Less</span>
        {[0.1, 0.25, 0.45, 0.65, 0.9].map((opacity) => (
          <div
            key={opacity}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: `hsl(var(--primary) / ${opacity})` }}
          />
        ))}
        <span className="text-[10px] text-muted-foreground">More</span>
      </div>
    </motion.div>
  );
}
