import { motion } from "framer-motion";
import { TrendingUp, Server, Calendar, ArrowUpRight, ArrowDownRight, IndianRupee } from "lucide-react";
import { formatINR } from "@/lib/currency";

interface KpiCardsProps {
  totalCostThisMonth: number;
  totalCostThisYear: number;
  averageDailyCost: number;
  totalResources: number;
}

const cards = [
  { key: "month", label: "Cost This Month", icon: IndianRupee, prefix: true, kpiClass: "kpi-card-1", changeLabel: "+12.4%", subLabel: "vs last month", up: true },
  { key: "year", label: "Cost This Year", icon: Calendar, prefix: true, kpiClass: "kpi-card-2", changeLabel: "-3.2%", subLabel: "vs last year", up: false },
  { key: "avg", label: "Avg Daily Cost", icon: TrendingUp, prefix: true, kpiClass: "kpi-card-3", changeLabel: "+5.1%", subLabel: "trending", up: true },
  { key: "resources", label: "Active Resources", icon: Server, prefix: false, kpiClass: "kpi-card-4", changeLabel: "18", subLabel: "tracked", up: true },
] as const;

const iconGradients: Record<string, [string, string]> = {
  month: ["hsl(215, 92%, 62%)", "hsl(215, 92%, 48%)"],
  year: ["hsl(172, 66%, 50%)", "hsl(172, 66%, 38%)"],
  avg: ["hsl(268, 60%, 62%)", "hsl(268, 60%, 48%)"],
  resources: ["hsl(38, 92%, 58%)", "hsl(38, 92%, 44%)"],
};

const kpiGlowColors: Record<string, { from: string; to: string }> = {
  month: { from: "hsl(var(--kpi-1))", to: "hsl(var(--chart-2))" },
  year: { from: "hsl(var(--kpi-2))", to: "hsl(var(--chart-3))" },
  avg: { from: "hsl(var(--kpi-3))", to: "hsl(var(--chart-1))" },
  resources: { from: "hsl(var(--kpi-4))", to: "hsl(var(--chart-5))" },
};

export function KpiCards({ totalCostThisMonth, totalCostThisYear, averageDailyCost, totalResources }: KpiCardsProps) {
  const values: Record<string, number> = {
    month: totalCostThisMonth,
    year: totalCostThisYear,
    avg: averageDailyCost,
    resources: totalResources,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={`glass-card-elevated p-3.5 sm:p-5 ${card.kpiClass} kpi-gradient-border group cursor-default relative overflow-hidden`}
          style={{
            '--kpi-glow-from': kpiGlowColors[card.key].from,
            '--kpi-glow-to': kpiGlowColors[card.key].to,
          } as React.CSSProperties}
        >
          <div className="flex items-start justify-between mb-2 sm:mb-3 relative">
            <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground tracking-wider uppercase leading-tight">
              {card.label}
            </span>
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-shadow duration-300"
              style={{ background: `linear-gradient(135deg, ${iconGradients[card.key][0]}, ${iconGradients[card.key][1]})` }}
            >
              <card.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
          </div>

          <p className="text-xl sm:text-2xl lg:text-[28px] font-extrabold text-foreground tracking-tight mb-1.5 sm:mb-2 tabular-nums relative">
            {card.prefix
              ? formatINR(values[card.key])
              : values[card.key].toLocaleString()
            }
          </p>

          <div className="flex items-center gap-1.5 relative">
            <div className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold tabular-nums ${
              card.up
                ? "bg-kpi-up/10 text-kpi-up"
                : "bg-kpi-down/10 text-kpi-down"
            }`}>
              {card.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {card.changeLabel}
            </div>
            <span className="text-[10px] text-muted-foreground">{card.subLabel}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
