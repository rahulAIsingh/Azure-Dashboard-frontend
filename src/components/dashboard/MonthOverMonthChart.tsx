import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { getChartTheme } from "@/lib/chartTheme";
import { useMemo } from "react";
import type { CostRecord } from "@/types/dashboardTypes";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";
import { GitCompareArrows } from "lucide-react";
import { formatINR, inrAxisFormatter } from "@/lib/currency";

interface MonthOverMonthChartProps {
  records: CostRecord[];
}

export function MonthOverMonthChart({ records }: MonthOverMonthChartProps) {
  const { theme } = useTheme();
  const ct = useMemo(() => getChartTheme(), [theme]);

  const data = useMemo(() => {
    const monthMap = new Map<string, Map<string, number>>();
    records.forEach((r) => {
      const month = format(parseISO(r.usageDate), "yyyy-MM");
      const service = r.serviceName;
      if (!monthMap.has(month)) monthMap.set(month, new Map());
      const svcMap = monthMap.get(month)!;
      svcMap.set(service, (svcMap.get(service) || 0) + r.cost);
    });

    const services = new Set<string>();
    records.forEach((r) => services.add(r.serviceName));

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-4)
      .map(([month, svcMap]) => {
        const entry: Record<string, any> = { month: format(parseISO(month + "-01"), "MMM yyyy") };
        services.forEach((s) => { entry[s] = Math.round((svcMap.get(s) || 0) * 100) / 100; });
        return entry;
      });
  }, [records]);

  const services = useMemo(() => {
    const s = new Set<string>();
    records.forEach((r) => s.add(r.serviceName));
    return Array.from(s);
  }, [records]);

  const colors = ["hsl(199, 89%, 48%)", "hsl(172, 66%, 50%)", "hsl(262, 60%, 58%)", "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)", "hsl(280, 65%, 60%)"];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="glass-card rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <GitCompareArrows className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-muted-foreground">Month-over-Month by Service</h3>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
            <XAxis dataKey="month" tick={{ fill: ct.text, fontSize: 11 }} />
            <YAxis tick={{ fill: ct.text, fontSize: 11 }} tickFormatter={inrAxisFormatter} />
            <Tooltip contentStyle={{ backgroundColor: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 8, color: ct.tooltipText }} formatter={(value: number) => [formatINR(value), ""]} />
            <Legend wrapperStyle={{ fontSize: 11, color: ct.text }} />
            {services.map((s, i) => (
              <Bar key={s} dataKey={s} stackId="a" fill={colors[i % colors.length]} radius={i === services.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
