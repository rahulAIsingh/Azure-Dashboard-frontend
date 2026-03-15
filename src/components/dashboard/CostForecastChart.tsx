import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { motion } from "framer-motion";
import { format, parseISO, addDays } from "date-fns";
import { useTheme } from "@/components/ThemeProvider";
import { getChartTheme } from "@/lib/chartTheme";
import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { formatINR, inrAxisFormatter } from "@/lib/currency";

interface CostForecastChartProps {
  dailyData: { date: string; cost: number }[];
}

export function CostForecastChart({ dailyData }: CostForecastChartProps) {
  const { theme } = useTheme();
  const ct = useMemo(() => getChartTheme(), [theme]);

  const forecastData = useMemo(() => {
    if (dailyData.length < 7) return dailyData.map((d) => ({ ...d, forecast: null as number | null }));

    // Simple linear regression on last 30 data points
    const recent = dailyData.slice(-30);
    const n = recent.length;
    const xs = recent.map((_, i) => i);
    const ys = recent.map((d) => d.cost);
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
    const sumXX = xs.reduce((a, x) => a + x * x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const historical = dailyData.map((d) => ({ date: d.date, cost: d.cost, forecast: null as number | null }));

    // Generate 30 days of forecast
    const lastDate = parseISO(dailyData[dailyData.length - 1].date);
    for (let i = 1; i <= 30; i++) {
      const forecastVal = Math.max(0, Math.round((intercept + slope * (n + i - 1)) * 100) / 100);
      historical.push({
        date: format(addDays(lastDate, i), "yyyy-MM-dd"),
        cost: null as any,
        forecast: forecastVal,
      });
    }

    // Bridge: add forecast start at last actual value
    if (historical.length > 0 && dailyData.length > 0) {
      const bridgeIndex = dailyData.length - 1;
      historical[bridgeIndex].forecast = historical[bridgeIndex].cost;
    }

    return historical;
  }, [dailyData]);

  const forecastTotal = useMemo(() => {
    return forecastData
      .filter((d) => d.forecast !== null && d.cost === null)
      .reduce((s, d) => s + (d.forecast || 0), 0);
  }, [forecastData]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-muted-foreground">Cost Forecast (30-day)</h3>
        </div>
        <span className="text-xs font-medium text-accent">
          Projected: {formatINR(forecastTotal)}
        </span>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={forecastData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(172, 66%, 50%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(172, 66%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
            <XAxis dataKey="date" tick={{ fill: ct.text, fontSize: 10 }} tickFormatter={(v) => format(parseISO(v), "MMM d")} interval="preserveStartEnd" />
            <YAxis tick={{ fill: ct.text, fontSize: 11 }} tickFormatter={inrAxisFormatter} />
            <Tooltip
              contentStyle={{ backgroundColor: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 8, color: ct.tooltipText }}
              labelFormatter={(v) => format(parseISO(v as string), "MMM d, yyyy")}
              formatter={(value: number | null, name: string) => {
                if (value === null) return ["-", name];
                return [formatINR(value), name === "cost" ? "Actual" : "Forecast"];
              }}
            />
            <Area type="monotone" dataKey="cost" stroke="hsl(199, 89%, 48%)" strokeWidth={2} fill="url(#actualGrad)" connectNulls={false} />
            <Area type="monotone" dataKey="forecast" stroke="hsl(172, 66%, 50%)" strokeWidth={2} strokeDasharray="6 3" fill="url(#forecastGrad)" connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
