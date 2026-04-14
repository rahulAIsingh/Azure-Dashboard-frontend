import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown, ChevronRight, Server, IndianRupee, Activity, Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatINR } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, parseISO, startOfMonth, subMonths, endOfMonth, isWithinInterval } from "date-fns";
import { useTheme } from "@/components/ThemeProvider";
import { getChartTheme, CHART_COLORS } from "@/lib/chartTheme";
import { Progress } from "@/components/ui/progress";
import type { CostRecord } from "@/types/dashboardTypes";
import { exportToCsv } from "@/lib/csvExport";

interface ResourceGroupDrilldownProps {
  resourceGroup: string;
  records: CostRecord[];
  allRecords?: CostRecord[];
  onBack: () => void;
}

interface ResourceDetail {
  resourceName: string;
  resourceType: string;
  serviceName: string;
  resourcePlan: string;
  location: string;
  totalCost: number;
  avgDailyCost: number;
  minDailyCost: number;
  maxDailyCost: number;
  days: number;
  dailyCosts: { date: string; cost: number }[];
  costPercentage: number;
}

export function ResourceGroupDrilldown({ resourceGroup, records, allRecords, onBack }: ResourceGroupDrilldownProps) {
  const { theme } = useTheme();
  const ct = useMemo(() => getChartTheme(), [theme]);
  const [expandedResource, setExpandedResource] = useState<string | null>(null);

  // Case-insensitive match so URL like /az-rohit-rg matches DB value 'AZ-ROHIT-RG'
  const rgLower = resourceGroup.toLowerCase();
  const rgRecords = useMemo(
    () => records.filter((r) => r.resourceGroup?.toLowerCase() === rgLower),
    [records, rgLower]
  );

  // Use the actual DB casing for display (from the first matched record)
  const displayName = rgRecords.length > 0 ? rgRecords[0].resourceGroup : resourceGroup;

  const totalCost = useMemo(() => rgRecords.reduce((s, r) => s + r.cost, 0), [rgRecords]);

  const resourceDetails = useMemo((): ResourceDetail[] => {
    const map = new Map<string, { type: string; service: string; plan: string; location: string; dailyMap: Map<string, number> }>();
    rgRecords.forEach((r) => {
      if (!map.has(r.resourceName)) {
        map.set(r.resourceName, { type: r.resourceType, service: r.serviceName, plan: r.resourcePlan || '', location: r.location, dailyMap: new Map() });
      }
      const entry = map.get(r.resourceName)!;
      entry.dailyMap.set(r.usageDate, (entry.dailyMap.get(r.usageDate) || 0) + r.cost);
    });

    return Array.from(map.entries()).map(([name, data]) => {
      const dailyCosts = Array.from(data.dailyMap.entries())
        .map(([date, cost]) => ({ date, cost: Math.round(cost * 100) / 100 }))
        .sort((a, b) => a.date.localeCompare(b.date));
      const costs = dailyCosts.map((d) => d.cost);
      const total = costs.reduce((s, c) => s + c, 0);

      return {
        resourceName: name,
        resourceType: data.type,
        serviceName: data.service,
        resourcePlan: data.plan,
        location: data.location,
        totalCost: Math.round(total * 100) / 100,
        avgDailyCost: Math.round((total / costs.length) * 100) / 100,
        minDailyCost: Math.round(Math.min(...costs) * 100) / 100,
        maxDailyCost: Math.round(Math.max(...costs) * 100) / 100,
        days: costs.length,
        dailyCosts,
        costPercentage: totalCost > 0 ? Math.round((total / totalCost) * 10000) / 100 : 0,
      };
    }).sort((a, b) => b.totalCost - a.totalCost);
  }, [rgRecords, totalCost]);

  const dailyTrend = useMemo(() => {
    const map = new Map<string, number>();
    rgRecords.forEach((r) => map.set(r.usageDate, (map.get(r.usageDate) || 0) + r.cost));
    return Array.from(map, ([date, cost]) => ({ date, cost: Math.round(cost * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [rgRecords]);

  const costByService = useMemo(() => {
    const map = new Map<string, number>();
    rgRecords.forEach((r) => map.set(r.serviceName, (map.get(r.serviceName) || 0) + r.cost));
    return Array.from(map, ([service, cost]) => ({ service, cost: Math.round(cost * 100) / 100 }))
      .sort((a, b) => b.cost - a.cost);
  }, [rgRecords]);



  // Month-over-Month Comparison
  const monthComparison = useMemo(() => {
    // Determine the reference month based on the provided records (latest date)
    const latestRecordDate = records.reduce((latest, r) => {
      const d = parseISO(r.usageDate);
      return d > latest ? d : latest;
    }, new Date(0));
    
    const referenceDate = latestRecordDate.getTime() === 0 ? new Date() : latestRecordDate;

    const thisMonthStart = startOfMonth(referenceDate);
    const lastMonthStart = startOfMonth(subMonths(referenceDate, 1));
    const lastMonthEnd = endOfMonth(subMonths(referenceDate, 1));

    // Use allRecords if available to ensure we have last month's data even if current filter restricts it
    const sourceRecords = allRecords 
      ? allRecords.filter(r => r.resourceGroup?.toLowerCase() === rgLower) 
      : rgRecords;

    const thisMonthCost = sourceRecords
      .filter((r) => parseISO(r.usageDate) >= thisMonthStart && parseISO(r.usageDate) <= endOfMonth(referenceDate))
      .reduce((s, r) => s + r.cost, 0);
      
    const lastMonthCost = sourceRecords
      .filter((r) => isWithinInterval(parseISO(r.usageDate), { start: lastMonthStart, end: lastMonthEnd }))
      .reduce((s, r) => s + r.cost, 0);

    const now = new Date();
    const isCurrentMonth = thisMonthStart.getMonth() === now.getMonth() && thisMonthStart.getFullYear() === now.getFullYear();
    const daysElapsed = isCurrentMonth 
        ? Math.max(1, Math.ceil((now.getTime() - thisMonthStart.getTime()) / 86400000))
        : Math.ceil((endOfMonth(referenceDate).getTime() - thisMonthStart.getTime()) / 86400000) + 1;

    const daysInMonth = Math.ceil((endOfMonth(referenceDate).getTime() - thisMonthStart.getTime()) / 86400000) + 1;

    // Only project if it's the current incomplete month
    const projectedThisMonth = isCurrentMonth 
        ? (thisMonthCost / daysElapsed) * daysInMonth 
        : thisMonthCost;

    const change = lastMonthCost > 0 ? ((projectedThisMonth - lastMonthCost) / lastMonthCost) * 100 : 0;
    const diff = projectedThisMonth - lastMonthCost;

    // Per-service breakdown
    const serviceMap = new Map<string, { thisMonth: number; lastMonth: number }>();
    sourceRecords.forEach((r) => {
      const d = parseISO(r.usageDate);
      if (!serviceMap.has(r.serviceName)) serviceMap.set(r.serviceName, { thisMonth: 0, lastMonth: 0 });
      const entry = serviceMap.get(r.serviceName)!;
      if (d >= thisMonthStart && d <= endOfMonth(referenceDate)) entry.thisMonth += r.cost;
      else if (isWithinInterval(d, { start: lastMonthStart, end: lastMonthEnd })) entry.lastMonth += r.cost;
    });

    const serviceBreakdown = Array.from(serviceMap.entries()).map(([service, costs]) => {
      const projected = isCurrentMonth ? (costs.thisMonth / daysElapsed) * daysInMonth : costs.thisMonth;
      const svcChange = costs.lastMonth > 0 ? ((projected - costs.lastMonth) / costs.lastMonth) * 100 : 0;
      return { service, thisMonth: Math.round(projected * 100) / 100, lastMonth: Math.round(costs.lastMonth * 100) / 100, change: Math.round(svcChange * 10) / 10 };
    }).filter(s => s.thisMonth > 0 || s.lastMonth > 0).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    return {
      thisMonthActual: Math.round(thisMonthCost * 100) / 100,
      lastMonthTotal: Math.round(lastMonthCost * 100) / 100,
      projected: Math.round(projectedThisMonth * 100) / 100,
      change: Math.round(change * 10) / 10,
      diff: Math.round(diff * 100) / 100,
      daysElapsed,
      daysInMonth,
      isCurrentMonth,
      serviceBreakdown,
      thisMonthLabel: format(thisMonthStart, "MMM yyyy"),
      lastMonthLabel: format(lastMonthStart, "MMM yyyy"),
    };
  }, [records, allRecords, rgRecords, rgLower]);

  const toggleResource = (name: string) => {
    setExpandedResource((prev) => (prev === name ? null : name));
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
            <p className="text-sm text-muted-foreground">
              {resourceDetails.length} resources · Total: {formatINR(totalCost)}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportToCsv(rgRecords, `${displayName}-costs`)}>
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </div>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Cost", value: formatINR(totalCost), icon: IndianRupee },
          { label: "Resources", value: String(resourceDetails.length), icon: Server },
          { label: "Avg Daily", value: formatINR(dailyTrend.length > 0 ? dailyTrend.reduce((s, d) => s + d.cost, 0) / dailyTrend.length : 0), icon: Activity },
          { label: "Services", value: String(costByService.length), icon: Activity },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-lg p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
              <kpi.icon className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-lg font-bold text-foreground">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Month-over-Month Comparison */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          {monthComparison.change > 0 ? (
            <TrendingUp className="h-4 w-4 text-destructive" />
          ) : monthComparison.change < 0 ? (
            <TrendingDown className="h-4 w-4 text-kpi-up" />
          ) : (
            <Minus className="h-4 w-4 text-muted-foreground" />
          )}
          <h3 className="text-sm font-semibold text-muted-foreground">Month-over-Month Comparison</h3>
        </div>

        <div className={`rounded-lg p-4 border ${monthComparison.change > 2 ? "border-destructive/30 bg-destructive/5" : monthComparison.change < -2 ? "border-kpi-up/30 bg-kpi-up/5" : "border-border bg-secondary/20"}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{monthComparison.isCurrentMonth ? `Projected ${monthComparison.thisMonthLabel} vs ${monthComparison.lastMonthLabel}` : `${monthComparison.thisMonthLabel} vs ${monthComparison.lastMonthLabel}`}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-foreground">{formatINR(monthComparison.projected)}</span>
                <span className="text-sm text-muted-foreground">vs {formatINR(monthComparison.lastMonthTotal)}</span>
              </div>
            </div>
            <div className={`text-right px-3 py-2 rounded-md ${monthComparison.change > 2 ? "bg-destructive/10 text-destructive" : monthComparison.change < -2 ? "bg-kpi-up/10 text-kpi-up" : "bg-secondary text-muted-foreground"}`}>
              <p className="text-xl font-bold">{monthComparison.change > 0 ? "+" : ""}{monthComparison.change}%</p>
              <p className="text-[10px]">{monthComparison.diff > 0 ? "+" : ""}{formatINR(Math.abs(monthComparison.diff))}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/50 text-sm">
            {monthComparison.change > 0 ? (
              <p className="text-foreground">
                You spent <span className="font-bold text-destructive">{formatINR(Math.abs(monthComparison.diff))} ({monthComparison.change}%) more</span> this month compared to {monthComparison.lastMonthLabel}.
              </p>
            ) : monthComparison.change < 0 ? (
              <p className="text-foreground">
                You spent <span className="font-bold text-kpi-up">{formatINR(Math.abs(monthComparison.diff))} ({-monthComparison.change}%) less</span> this month compared to {monthComparison.lastMonthLabel}.
              </p>
            ) : (
              <p className="text-foreground">Your spend is exactly the same as {monthComparison.lastMonthLabel}.</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              {monthComparison.isCurrentMonth ? `Based on ${monthComparison.daysElapsed} days elapsed (Actual: ${formatINR(monthComparison.thisMonthActual)})` : `Based on complete billing data for ${monthComparison.thisMonthLabel}`}
            </p>
          </div>
        </div>

        {monthComparison.serviceBreakdown.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">Change by Service</p>
            <div className="space-y-2">
              {monthComparison.serviceBreakdown.map((svc) => (
                <div key={svc.service} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-md hover:bg-secondary/20 transition-colors">
                  <span className="text-foreground font-medium">{svc.service}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{formatINR(svc.lastMonth, 0)} → {formatINR(svc.thisMonth, 0)}</span>
                    <span className={`font-semibold min-w-[60px] text-right ${svc.change > 2 ? "text-destructive" : svc.change < -2 ? "text-kpi-up" : "text-muted-foreground"}`}>
                      {svc.change > 0 ? "+" : ""}{svc.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Cost by Service */}
      <div className="glass-card rounded-lg p-5">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">Cost by Service</h3>
        <div className="space-y-2">
          {costByService.map((s, i) => (
            <div key={s.service} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="text-sm text-muted-foreground flex-1 truncate">{s.service}</span>
              <span className="text-sm font-medium text-foreground">{formatINR(s.cost, 0)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily trend */}
        <div className="lg:col-span-2 glass-card rounded-lg p-5">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">Daily Cost Trend</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="rgGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(172, 66%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(172, 66%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                <XAxis dataKey="date" tick={{ fill: ct.text, fontSize: 10 }} tickFormatter={(v) => format(parseISO(v), "MMM d")} interval="preserveStartEnd" />
                <YAxis tick={{ fill: ct.text, fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip contentStyle={{ backgroundColor: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 8, color: ct.tooltipText }} labelFormatter={(v) => format(parseISO(v as string), "MMM d, yyyy")} formatter={(value: number) => [formatINR(value), "Cost"]} />
                <Area type="monotone" dataKey="cost" stroke="hsl(172, 66%, 50%)" strokeWidth={2} fill="url(#rgGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost by service pie */}
        <div className="glass-card rounded-lg p-5">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">By Service</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={costByService} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="cost" nameKey="service" paddingAngle={3} strokeWidth={0}>
                  {costByService.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 8, color: ct.tooltipText }} formatter={(value: number) => [formatINR(value), "Cost"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 mt-2">
            {costByService.map((s, i) => (
              <div key={s.service} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-muted-foreground">{s.service}</span>
                </div>
                <span className="text-foreground font-medium">{formatINR(s.cost, 0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resource details with expandable rows */}
      <div className="glass-card rounded-lg p-5 overflow-x-auto">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">All Resources — Usage & Pricing</h3>
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-muted-foreground font-medium">
            <div className="col-span-1"></div>
            <div className="col-span-3">Resource</div>
            <div className="col-span-2">Service</div>
            <div className="col-span-1">Region</div>
            <div className="col-span-1 text-right">Avg/Day</div>
            <div className="col-span-1 text-right">Min</div>
            <div className="col-span-1 text-right">Max</div>
            <div className="col-span-1 text-right">Total</div>
            <div className="col-span-1 text-right">Share</div>
          </div>

          {resourceDetails.map((res, idx) => (
            <div key={res.resourceName}>
              {/* Main row */}
              <div
                className="grid grid-cols-12 gap-2 px-3 py-3 rounded-md border border-border/30 hover:bg-secondary/30 cursor-pointer transition-colors items-center"
                onClick={() => toggleResource(res.resourceName)}
              >
                <div className="col-span-1">
                  {expandedResource === res.resourceName ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="col-span-3">
                  <p className="text-sm font-medium text-foreground truncate">{res.resourceName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{res.resourceType}</p>
                </div>
                <div className="col-span-2 text-sm">
                  <p className="text-muted-foreground truncate">{res.serviceName}</p>
                  {res.resourcePlan && (
                    <p className="text-[10px] text-primary/80 font-medium truncate">({res.resourcePlan})</p>
                  )}
                </div>
                <div className="col-span-1 text-xs text-muted-foreground">{res.location}</div>
                <div className="col-span-1 text-right text-sm text-foreground">{formatINR(res.avgDailyCost, 2)}</div>
                <div className="col-span-1 text-right text-xs text-kpi-up">{formatINR(res.minDailyCost, 2)}</div>
                <div className="col-span-1 text-right text-xs text-destructive">{formatINR(res.maxDailyCost, 2)}</div>
                <div className="col-span-1 text-right text-sm font-bold text-foreground">{formatINR(res.totalCost)}</div>
                <div className="col-span-1 text-right">
                  <div className="inline-flex items-center gap-1">
                    <Progress value={res.costPercentage} className="h-1.5 w-10 [&>div]:bg-primary" />
                    <span className="text-[10px] text-muted-foreground">{res.costPercentage}%</span>
                  </div>
                </div>
              </div>

              {/* Expanded detail */}
              <AnimatePresence>
                {expandedResource === res.resourceName && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mx-3 mb-2 p-4 rounded-md bg-secondary/20 border border-border/20 space-y-4">
                      {/* Resource stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Cost</p>
                          <p className="text-lg font-bold text-foreground">{formatINR(res.totalCost)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Daily</p>
                          <p className="text-lg font-bold text-foreground">{formatINR(res.avgDailyCost, 2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Projected Monthly</p>
                          <p className="text-lg font-bold text-accent">{formatINR(res.avgDailyCost * 30, 2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Daily Range</p>
                          <p className="text-lg font-bold text-foreground">{formatINR(res.minDailyCost, 2)} – {formatINR(res.maxDailyCost, 2)}</p>
                        </div>
                      </div>

                      {/* Charts row: Daily bar + Area trend + Cost distribution */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Daily usage bar chart */}
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-2">Daily Cost Breakdown</p>
                          <div className="h-[160px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={res.dailyCosts} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                                <XAxis dataKey="date" tick={{ fill: ct.text, fontSize: 9 }} tickFormatter={(v) => format(parseISO(v), "d")} />
                                <YAxis tick={{ fill: ct.text, fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 8, color: ct.tooltipText }}
                                  labelFormatter={(v) => format(parseISO(v as string), "MMM d, yyyy")}
                                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Cost"]}
                                />
                                <Bar dataKey="cost" fill={CHART_COLORS[idx % CHART_COLORS.length]} radius={[2, 2, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Cost trend area chart */}
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-2">Cost Trend</p>
                          <div className="h-[160px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={res.dailyCosts} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                                <defs>
                                  <linearGradient id={`resGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                                <XAxis dataKey="date" tick={{ fill: ct.text, fontSize: 9 }} tickFormatter={(v) => format(parseISO(v), "d")} />
                                <YAxis tick={{ fill: ct.text, fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 8, color: ct.tooltipText }}
                                  labelFormatter={(v) => format(parseISO(v as string), "MMM d, yyyy")}
                                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Cost"]}
                                />
                                <Area type="monotone" dataKey="cost" stroke={CHART_COLORS[idx % CHART_COLORS.length]} strokeWidth={2} fill={`url(#resGrad-${idx})`} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Cost distribution - above/below avg */}
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-2">Cost Distribution</p>
                          <div className="h-[160px]">
                            {(() => {
                              const above = res.dailyCosts.filter(d => d.cost >= res.avgDailyCost).length;
                              const below = res.dailyCosts.length - above;
                              const pieData = [
                                { name: "Above Avg", value: above },
                                { name: "Below Avg", value: below },
                              ];
                              return (
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" nameKey="name" paddingAngle={4} strokeWidth={0}>
                                      <Cell fill="hsl(var(--destructive))" />
                                      <Cell fill="hsl(var(--primary))" />
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 8, color: ct.tooltipText }} formatter={(value: number, name: string) => [`${value} days`, name]} />
                                  </PieChart>
                                </ResponsiveContainer>
                              );
                            })()}
                          </div>
                          <div className="flex justify-center gap-4 mt-1">
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <div className="w-2 h-2 rounded-full bg-destructive" />
                              <span className="text-muted-foreground">Above avg ({res.dailyCosts.filter(d => d.cost >= res.avgDailyCost).length}d)</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              <span className="text-muted-foreground">Below avg ({res.dailyCosts.filter(d => d.cost < res.avgDailyCost).length}d)</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Daily breakdown table */}
                      <div className="max-h-[200px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border/30 hover:bg-transparent">
                              <TableHead className="text-muted-foreground text-xs">Date</TableHead>
                              <TableHead className="text-muted-foreground text-xs text-right">Cost</TableHead>
                              <TableHead className="text-muted-foreground text-xs text-right">vs Avg</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {res.dailyCosts.slice().reverse().map((d) => {
                              const diff = d.cost - res.avgDailyCost;
                              const diffPct = res.avgDailyCost > 0 ? (diff / res.avgDailyCost) * 100 : 0;
                              return (
                                <TableRow key={d.date} className="border-border/20 hover:bg-secondary/20">
                                  <TableCell className="text-xs text-foreground">{format(parseISO(d.date), "MMM d, yyyy")}</TableCell>
                                  <TableCell className="text-xs text-right font-medium text-foreground">{formatINR(d.cost, 2)}</TableCell>
                                  <TableCell className={`text-xs text-right font-medium ${diff > 0 ? "text-destructive" : "text-kpi-up"}`}>
                                    {diff > 0 ? "+" : ""}{diffPct.toFixed(1)}%
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
