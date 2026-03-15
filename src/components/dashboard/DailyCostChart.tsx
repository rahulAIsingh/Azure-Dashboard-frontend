import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { useTheme } from "@/components/ThemeProvider";
import { getChartTheme, tooltipStyle } from "@/lib/chartTheme";
import { useMemo } from "react";
import { Activity } from "lucide-react";
import { formatINR, inrAxisFormatter } from "@/lib/currency";

interface DailyCostChartProps {
  data: { date: string; cost: number }[];
}

export function DailyCostChart({ data }: DailyCostChartProps) {
  const { theme } = useTheme();
  const ct = useMemo(() => getChartTheme(), [theme]);
  const totalPeriod = data.reduce((s, d) => s + d.cost, 0);
  const avgCost = data.length > 0 ? totalPeriod / data.length : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card-elevated p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Activity className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h3 className="section-title">Daily Cost Trend</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Avg {formatINR(avgCost, 0)}/day</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted-foreground font-medium">Period Total</p>
          <p className="text-lg font-extrabold text-foreground tabular-nums">{formatINR(totalPeriod)}</p>
        </div>
      </div>
      <div className="h-[280px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 12, bottom: 5, left: -8 }}>
            <defs>
              <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(200, 95%, 50%)" stopOpacity={0.2} />
                <stop offset="50%" stopColor="hsl(200, 95%, 50%)" stopOpacity={0.06} />
                <stop offset="100%" stopColor="hsl(200, 95%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" stroke={ct.grid} strokeOpacity={0.6} vertical={false} />
            <XAxis dataKey="date" tick={{ fill: ct.text, fontSize: 10, fontWeight: 500 }} tickFormatter={(v) => format(parseISO(v), "MMM d")} interval="preserveStartEnd" axisLine={{ stroke: ct.grid, strokeOpacity: 0.5 }} tickLine={false} />
            <YAxis tick={{ fill: ct.text, fontSize: 10, fontWeight: 500 }} tickFormatter={inrAxisFormatter} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle(ct)} labelFormatter={(v) => format(parseISO(v as string), "MMM d, yyyy")} formatter={(value: number) => [formatINR(value), "Cost"]} />
            <Area type="monotone" dataKey="cost" stroke="hsl(200, 95%, 50%)" strokeWidth={2} fill="url(#costGradient)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(200, 95%, 50%)", fill: "hsl(var(--card))" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
