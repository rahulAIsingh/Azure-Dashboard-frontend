import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { getChartTheme, CHART_COLORS } from "@/lib/chartTheme";
import { useMemo } from "react";
import { CreditCard } from "lucide-react";
import { formatINR, inrAxisFormatter } from "@/lib/currency";

interface SubscriptionCostChartProps {
  data: { subscription: string; cost: number }[];
  onSelectSubscription?: (subscription: string) => void;
}

export function SubscriptionCostChart({ data, onSelectSubscription }: SubscriptionCostChartProps) {
  const { theme } = useTheme();
  const ct = useMemo(() => getChartTheme(), [theme]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card-elevated p-6">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 rounded-lg bg-chart-3/10 flex items-center justify-center">
          <CreditCard className="h-4 w-4 text-chart-3" />
        </div>
        <h3 className="section-title">Cost by Subscription</h3>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
            <XAxis dataKey="subscription" tick={{ fill: ct.text, fontSize: 11, fontWeight: 500 }} />
            <YAxis tick={{ fill: ct.text, fontSize: 11 }} tickFormatter={inrAxisFormatter} />
            <Tooltip contentStyle={{ backgroundColor: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 12, color: ct.tooltipText, padding: "12px 16px", fontWeight: 500 }} formatter={(value: number) => [formatINR(value), "Cost"]} />
            <Bar 
              dataKey="cost" 
              radius={[6, 6, 0, 0]}
              onClick={(data: any) => {
                if (data && data.subscription && onSelectSubscription) {
                  onSelectSubscription(data.subscription);
                }
              }}
              style={{ cursor: onSelectSubscription ? 'pointer' : 'default' }}
            >
              {data.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} className="transition-all duration-200 hover:opacity-80" />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
