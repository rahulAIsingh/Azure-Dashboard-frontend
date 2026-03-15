import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { getChartTheme, CHART_COLORS, tooltipStyle } from "@/lib/chartTheme";
import { useMemo } from "react";
import { PieChartIcon } from "lucide-react";
import { formatINR, formatINRShort } from "@/lib/currency";

interface CostByServiceChartProps {
  data: { service: string; cost: number }[];
  onSelectService?: (service: string) => void;
}

export function CostByServiceChart({ data, onSelectService }: CostByServiceChartProps) {
  const { theme } = useTheme();
  const ct = useMemo(() => getChartTheme(), [theme]);
  const total = data.reduce((s, d) => s + d.cost, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card-elevated p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent/5">
          <PieChartIcon className="h-4.5 w-4.5 text-accent" />
        </div>
        <div>
          <h3 className="section-title">Cost by Service</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {data.length} services · {formatINR(total, 0)} total
            {onSelectService ? " · click a service to drill in" : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <div className="relative h-[200px] w-[200px] shrink-0">
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
            <span className="text-[10px] font-medium text-muted-foreground">Total</span>
            <span className="tabular-nums text-base font-extrabold text-foreground">{formatINRShort(total)}</span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={92}
                dataKey="cost"
                nameKey="service"
                paddingAngle={3}
                strokeWidth={0}
                cornerRadius={4}
                onClick={onSelectService ? (_, index) => {
                  const clicked = data[index];
                  if (clicked) onSelectService(clicked.service);
                } : undefined}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} className={onSelectService ? "cursor-pointer" : ""} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle(ct)} formatter={(value: number) => [formatINR(value), "Cost"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full flex-1 space-y-2.5">
          {data.map((d, i) => {
            const pct = total > 0 ? (d.cost / total) * 100 : 0;
            return (
              <button
                key={d.service}
                type="button"
                onClick={onSelectService ? () => onSelectService(d.service) : undefined}
                className={`w-full rounded-lg px-2 py-1.5 text-left transition-colors ${
                  onSelectService ? "hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" : ""
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-xs font-medium text-foreground sm:text-sm">{d.service}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums text-[10px] text-muted-foreground">{pct.toFixed(1)}%</span>
                    <span className="tabular-nums text-xs font-bold text-foreground sm:text-sm">{formatINR(d.cost, 0)}</span>
                  </div>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-muted/60">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.1 * i, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
