import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { getChartTheme, CHART_COLORS, tooltipStyle } from "@/lib/chartTheme";
import { useMemo } from "react";
import { ChevronRight, Layers } from "lucide-react";
import { formatINR, inrAxisFormatter } from "@/lib/currency";

interface CostByResourceGroupChartProps {
  data: { resourceGroup: string; cost: number }[];
  onSelectGroup?: (rg: string) => void;
}

export function CostByResourceGroupChart({ data, onSelectGroup }: CostByResourceGroupChartProps) {
  const { theme } = useTheme();
  const ct = useMemo(() => getChartTheme(), [theme]);
  const total = data.reduce((s, d) => s + d.cost, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card-elevated p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Layers className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h3 className="section-title">Cost by Resource Group</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">{data.length} groups · {formatINR(total, 0)} total</p>
          </div>
        </div>
        <span className="text-[10px] text-primary font-semibold bg-primary/8 px-2.5 py-1 rounded-full border border-primary/15">Click to drill</span>
      </div>
      <div className="h-[220px] mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 12, bottom: 5, left: -8 }}>
            <CartesianGrid strokeDasharray="3 6" stroke={ct.grid} strokeOpacity={0.5} vertical={false} />
            <XAxis dataKey="resourceGroup" tick={{ fill: ct.text, fontSize: 10, fontWeight: 500 }} axisLine={{ stroke: ct.grid, strokeOpacity: 0.5 }} tickLine={false} />
            <YAxis tick={{ fill: ct.text, fontSize: 10, fontWeight: 500 }} tickFormatter={inrAxisFormatter} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle(ct)} formatter={(value: number) => [formatINR(value), "Cost"]} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
            <Bar dataKey="cost" radius={[8, 8, 0, 0]} cursor="pointer" onClick={(d) => onSelectGroup?.(d.resourceGroup)}>
              {data.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-0.5 border-t border-border/30 pt-3">
        {data.map((d, i) => {
          const pct = total > 0 ? (d.cost / total) * 100 : 0;
          return (
            <button key={d.resourceGroup} onClick={() => onSelectGroup?.(d.resourceGroup)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-all duration-200 group text-left">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="text-sm text-foreground font-medium flex-1 truncate">{d.resourceGroup}</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">{pct.toFixed(1)}%</span>
              <span className="text-sm text-foreground font-bold tabular-nums">{formatINR(d.cost, 0)}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
