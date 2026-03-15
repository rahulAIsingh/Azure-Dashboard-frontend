import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { getChartTheme } from "@/lib/chartTheme";
import { useMemo } from "react";
import { Flame } from "lucide-react";
import { formatINR, inrAxisFormatter } from "@/lib/currency";

interface TopResourcesChartProps {
  data: { resourceName: string; cost: number }[];
}

export function TopResourcesChart({ data }: TopResourcesChartProps) {
  const { theme } = useTheme();
  const ct = useMemo(() => getChartTheme(), [theme]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card-elevated p-6">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
          <Flame className="h-4 w-4 text-destructive" />
        </div>
        <h3 className="section-title">Top 10 Expensive Resources</h3>
      </div>
      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} horizontal={false} />
            <XAxis type="number" tick={{ fill: ct.text, fontSize: 11 }} tickFormatter={inrAxisFormatter} />
            <YAxis dataKey="resourceName" type="category" width={140} tick={{ fill: ct.text, fontSize: 11, fontWeight: 500 }} />
            <Tooltip contentStyle={{ backgroundColor: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 12, color: ct.tooltipText, padding: "12px 16px", fontWeight: 500 }} formatter={(value: number) => [formatINR(value), "Cost"]} />
            <Bar dataKey="cost" fill="hsl(162, 72%, 50%)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
