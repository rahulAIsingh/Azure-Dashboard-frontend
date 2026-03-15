import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, ArrowLeft, Server, MapPin, Calendar, IndianRupee, TrendingUp, TrendingDown } from "lucide-react";
import { formatINR } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts";
import { getChartTheme, CHART_COLORS } from "@/lib/chartTheme";
import type { CostRecord } from "@/types/dashboardTypes";

interface CostTreemapProps {
  records: CostRecord[];
  onDrillToGroup?: (resourceGroup: string) => void;
}

interface TreemapItem {
  name: string;
  cost: number;
  percentage: number;
  color: string;
  resourceGroup: string;
}

interface ResourceDetail {
  resourceName: string;
  resourceType: string;
  resourceGroup: string;
  serviceName: string;
  location: string;
  totalCost: number;
  avgDailyCost: number;
  minDailyCost: number;
  maxDailyCost: number;
  dailyCosts: { date: string; cost: number }[];
  costTrend: number; // % change recent vs older
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(var(--primary) / 0.6)",
  "hsl(var(--accent) / 0.6)",
];

export function CostTreemap({ records, onDrillToGroup }: CostTreemapProps) {
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const chartTheme = getChartTheme();

  const treemapData = useMemo(() => {
    const resourceCosts = new Map<string, { cost: number; service: string; rg: string }>();
    records.forEach((r) => {
      const entry = resourceCosts.get(r.resourceName) || { cost: 0, service: r.serviceName, rg: r.resourceGroup };
      entry.cost += r.cost;
      resourceCosts.set(r.resourceName, entry);
    });

    const totalCost = Array.from(resourceCosts.values()).reduce((s, v) => s + v.cost, 0);

    const items: TreemapItem[] = Array.from(resourceCosts.entries())
      .map(([name, { cost, rg }], i) => ({
        name,
        cost: Math.round(cost * 100) / 100,
        percentage: totalCost > 0 ? (cost / totalCost) * 100 : 0,
        color: COLORS[i % COLORS.length],
        resourceGroup: rg,
      }))
      .sort((a, b) => b.cost - a.cost);

    return items;
  }, [records]);

  const resourceDetail = useMemo<ResourceDetail | null>(() => {
    if (!selectedResource) return null;

    const resRecords = records.filter((r) => r.resourceName === selectedResource);
    if (resRecords.length === 0) return null;

    const first = resRecords[0];
    const dailyMap = new Map<string, number>();
    resRecords.forEach((r) => {
      dailyMap.set(r.usageDate, (dailyMap.get(r.usageDate) || 0) + r.cost);
    });

    const dailyCosts = Array.from(dailyMap, ([date, cost]) => ({ date, cost: Math.round(cost * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalCost = dailyCosts.reduce((s, d) => s + d.cost, 0);
    const avgDailyCost = dailyCosts.length > 0 ? totalCost / dailyCosts.length : 0;
    const costs = dailyCosts.map((d) => d.cost);
    const minDailyCost = Math.min(...costs);
    const maxDailyCost = Math.max(...costs);

    // Trend: compare last 7 days avg vs previous 7 days avg
    const recent = dailyCosts.slice(-7);
    const older = dailyCosts.slice(-14, -7);
    const recentAvg = recent.length > 0 ? recent.reduce((s, d) => s + d.cost, 0) / recent.length : 0;
    const olderAvg = older.length > 0 ? older.reduce((s, d) => s + d.cost, 0) / older.length : 0;
    const costTrend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

    return {
      resourceName: first.resourceName,
      resourceType: first.resourceType,
      resourceGroup: first.resourceGroup,
      serviceName: first.serviceName,
      location: first.location,
      totalCost: Math.round(totalCost * 100) / 100,
      avgDailyCost: Math.round(avgDailyCost * 100) / 100,
      minDailyCost: Math.round(minDailyCost * 100) / 100,
      maxDailyCost: Math.round(maxDailyCost * 100) / 100,
      dailyCosts,
      costTrend: Math.round(costTrend * 10) / 10,
    };
  }, [selectedResource, records]);

  const totalCost = treemapData.reduce((s, i) => s + i.cost, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-elevated p-4 sm:p-6"
    >
      <AnimatePresence mode="wait">
        {selectedResource && resourceDetail ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Detail Header */}
            <div className="flex items-center gap-3 mb-5">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setSelectedResource(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-foreground text-sm sm:text-base truncate">{resourceDetail.resourceName}</h3>
                  <Badge variant="secondary" className="text-[10px]">{resourceDetail.serviceName}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1"><Server className="h-3 w-3" />{resourceDetail.resourceGroup}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{resourceDetail.location}</span>
                  <span className="text-[10px] text-muted-foreground/70">{resourceDetail.resourceType.split("/").pop()}</span>
                </div>
              </div>
              {onDrillToGroup && (
                <Button variant="outline" size="sm" className="text-xs shrink-0" onClick={() => onDrillToGroup(resourceDetail.resourceGroup)}>
                  View Group
                </Button>
              )}
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Total Cost", value: formatINR(resourceDetail.totalCost), icon: IndianRupee },
                { label: "Avg / Day", value: formatINR(resourceDetail.avgDailyCost), icon: Calendar },
                { label: "Min / Day", value: formatINR(resourceDetail.minDailyCost), icon: TrendingDown },
                { label: "Max / Day", value: formatINR(resourceDetail.maxDailyCost), icon: TrendingUp },
              ].map((kpi) => (
                <div key={kpi.label} className="p-3 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-1.5 mb-1">
                    <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] sm:text-xs text-muted-foreground">{kpi.label}</span>
                  </div>
                  <span className="text-sm sm:text-lg font-bold text-foreground">{kpi.value}</span>
                </div>
              ))}
            </div>

            {/* Trend indicator */}
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-muted/30">
              <span className="text-xs text-muted-foreground">7-day trend:</span>
              <div className={`flex items-center gap-1 ${resourceDetail.costTrend > 0 ? "text-destructive" : "text-kpi-up"}`}>
                {resourceDetail.costTrend > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                <span className="text-sm font-semibold">{resourceDetail.costTrend > 0 ? "+" : ""}{resourceDetail.costTrend}%</span>
              </div>
              <span className="text-[10px] text-muted-foreground">vs previous 7 days</span>
            </div>

            {/* Daily cost chart */}
            <div className="h-[200px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={resourceDetail.dailyCosts}>
                  <defs>
                    <linearGradient id="treemapGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: chartTheme.text }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: chartTheme.text }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTheme.tooltipBg,
                      border: `1px solid ${chartTheme.tooltipBorder}`,
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [formatINR(value), "Cost"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    stroke={CHART_COLORS[0]}
                    fill="url(#treemapGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Daily breakdown table (last 7 days) */}
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Recent Daily Costs</h4>
              <div className="space-y-1.5">
                {resourceDetail.dailyCosts.slice(-7).reverse().map((day) => {
                  const pct = resourceDetail.maxDailyCost > 0 ? (day.cost / resourceDetail.maxDailyCost) * 100 : 0;
                  return (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-[10px] sm:text-xs text-muted-foreground w-20 shrink-0">{day.date.slice(5)}</span>
                      <div className="flex-1">
                        <Progress value={pct} className="h-2" />
                      </div>
                      <span className="text-xs font-semibold text-foreground w-16 text-right">{formatINR(day.cost, 0)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="treemap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <LayoutGrid className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground text-sm sm:text-base">Cost Distribution</h3>
              <span className="text-xs text-muted-foreground ml-auto">Click to drill down</span>
            </div>

            {/* Treemap visualization */}
            <div className="flex flex-wrap gap-1 min-h-[200px] sm:min-h-[260px]">
              {treemapData.map((item, i) => {
                const widthPercent = Math.max((item.cost / totalCost) * 100, 5);
                const isLarge = item.percentage > 8;
                return (
                  <motion.div
                    key={item.name}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    whileHover={{ scale: 1.03, zIndex: 10 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedResource(item.name)}
                    className="rounded-lg p-2 sm:p-3 flex flex-col justify-between cursor-pointer hover:brightness-110 hover:shadow-lg transition-all overflow-hidden relative group"
                    style={{
                      backgroundColor: item.color,
                      flexGrow: item.cost,
                      flexBasis: `${Math.max(widthPercent * 2, 60)}px`,
                      minHeight: isLarge ? "80px" : "50px",
                    }}
                    title={`${item.name}: ${formatINR(item.cost)} (${item.percentage.toFixed(1)}%) — Click to view details`}
                  >
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
                    <span className={`font-semibold truncate relative ${isLarge ? "text-xs sm:text-sm" : "text-[9px] sm:text-[10px]"}`}
                      style={{ color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                    >
                      {item.name}
                    </span>
                    {isLarge && (
                      <div style={{ color: "rgba(255,255,255,0.9)" }} className="relative">
                        <div className="text-sm sm:text-lg font-bold">{formatINR(item.cost, 0)}</div>
                        <div className="text-[9px] sm:text-[10px]">{item.percentage.toFixed(1)}%</div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-3 border-t border-border/50">
              {treemapData.slice(0, 6).map((item) => (
                <button
                  key={item.name}
                  onClick={() => setSelectedResource(item.name)}
                  className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                >
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[100px]">{item.name}</span>
                </button>
              ))}
              {treemapData.length > 6 && (
                <span className="text-[10px] text-muted-foreground">+{treemapData.length - 6} more</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
