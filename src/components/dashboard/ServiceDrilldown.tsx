import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Download,
  IndianRupee,
  Layers3,
  MapPin,
  Package2,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO, startOfMonth, subMonths, endOfMonth, isWithinInterval } from "date-fns";
import { useTheme } from "@/components/ThemeProvider";
import { getChartTheme, CHART_COLORS } from "@/lib/chartTheme";
import { formatINR, formatINRShort } from "@/lib/currency";
import { exportToCsv } from "@/lib/csvExport";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CostRecord } from "@/types/dashboardTypes";

interface ServiceDrilldownProps {
  service: string;
  records: CostRecord[];
  allRecords?: CostRecord[];
  onBack: () => void;
}

interface ResourceBreakdown {
  resourceName: string;
  resourceGroup: string;
  resourceType: string;
  resourcePlan: string;
  location: string;
  totalCost: number;
  avgDailyCost: number;
  maxDailyCost: number;
  dailyCosts: { date: string; cost: number }[];
}

const normalizeKey = (value?: string | null) => (value ?? "").trim().toLowerCase();
const fallbackPlan = (plan?: string | null) => plan?.trim() || "Standard / Unspecified";
const fallbackLocation = (location?: string | null) => location?.trim() || "Unspecified";
const fallbackGroup = (resourceGroup?: string | null) => resourceGroup?.trim() || "Unassigned";

export function ServiceDrilldown({ service, records, allRecords, onBack }: ServiceDrilldownProps) {
  const { theme } = useTheme();
  const chartTheme = useMemo(() => getChartTheme(), [theme]);
  const [expandedResource, setExpandedResource] = useState<string | null>(null);

  const serviceKey = normalizeKey(service);
  const serviceRecords = useMemo(
    () => records.filter((record) => normalizeKey(record.serviceName) === serviceKey),
    [records, serviceKey]
  );

  const displayName = serviceRecords[0]?.serviceName || service;
  const totalCost = serviceRecords.reduce((sum, record) => sum + record.cost, 0);

  const dailyTrend = useMemo(() => {
    const map = new Map<string, number>();
    serviceRecords.forEach((record) => {
      map.set(record.usageDate, (map.get(record.usageDate) || 0) + record.cost);
    });

    return Array.from(map.entries())
      .map(([date, cost]) => ({ date, cost: Math.round(cost * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [serviceRecords]);

  const planBreakdown = useMemo(() => {
    const map = new Map<string, { plan: string; cost: number; resources: Set<string> }>();
    serviceRecords.forEach((record) => {
      const key = normalizeKey(record.resourcePlan) || "__blank__";
      const entry = map.get(key) ?? { plan: fallbackPlan(record.resourcePlan), cost: 0, resources: new Set<string>() };
      entry.cost += record.cost;
      entry.resources.add(record.resourceName);
      map.set(key, entry);
    });

    return Array.from(map.values())
      .map((entry) => ({
        plan: entry.plan,
        cost: Math.round(entry.cost * 100) / 100,
        resources: entry.resources.size,
        share: totalCost > 0 ? (entry.cost / totalCost) * 100 : 0,
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [serviceRecords, totalCost]);

  const locationBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    serviceRecords.forEach((record) => {
      const location = fallbackLocation(record.location);
      map.set(location, (map.get(location) || 0) + record.cost);
    });

    return Array.from(map.entries())
      .map(([location, cost]) => ({ location, cost: Math.round(cost * 100) / 100 }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 6);
  }, [serviceRecords]);

  const resourceGroupBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    serviceRecords.forEach((record) => {
      const resourceGroup = fallbackGroup(record.resourceGroup);
      map.set(resourceGroup, (map.get(resourceGroup) || 0) + record.cost);
    });

    return Array.from(map.entries())
      .map(([resourceGroup, cost]) => ({ resourceGroup, cost: Math.round(cost * 100) / 100 }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 6);
  }, [serviceRecords]);

  const resourceBreakdown = useMemo<ResourceBreakdown[]>(() => {
    const map = new Map<string, {
      resourceName: string;
      resourceGroup: string;
      resourceType: string;
      resourcePlan: string;
      location: string;
      dailyMap: Map<string, number>;
    }>();

    serviceRecords.forEach((record) => {
      const key = normalizeKey(record.resourceName);
      const existing = map.get(key) ?? {
        resourceName: record.resourceName,
        resourceGroup: fallbackGroup(record.resourceGroup),
        resourceType: record.resourceType,
        resourcePlan: fallbackPlan(record.resourcePlan),
        location: fallbackLocation(record.location),
        dailyMap: new Map<string, number>(),
      };

      existing.dailyMap.set(record.usageDate, (existing.dailyMap.get(record.usageDate) || 0) + record.cost);
      map.set(key, existing);
    });

    return Array.from(map.values())
      .map((entry) => {
        const dailyCosts = Array.from(entry.dailyMap.entries())
          .map(([date, cost]) => ({ date, cost: Math.round(cost * 100) / 100 }))
          .sort((a, b) => a.date.localeCompare(b.date));
        const total = dailyCosts.reduce((sum, item) => sum + item.cost, 0);
        const avg = dailyCosts.length > 0 ? total / dailyCosts.length : 0;
        const max = dailyCosts.length > 0 ? Math.max(...dailyCosts.map((item) => item.cost)) : 0;

        return {
          resourceName: entry.resourceName,
          resourceGroup: entry.resourceGroup,
          resourceType: entry.resourceType,
          resourcePlan: entry.resourcePlan,
          location: entry.location,
          totalCost: Math.round(total * 100) / 100,
          avgDailyCost: Math.round(avg * 100) / 100,
          maxDailyCost: Math.round(max * 100) / 100,
          dailyCosts,
        };
      })
      .sort((a, b) => b.totalCost - a.totalCost);
  }, [serviceRecords]);

  // Month-over-Month Comparison
  const monthComparison = useMemo(() => {
    // Determine the reference month based on latest date in records
    const latestRecordDate = records.reduce((latest, r) => {
      const d = parseISO(r.usageDate);
      return d > latest ? d : latest;
    }, new Date(0));
    
    const referenceDate = latestRecordDate.getTime() === 0 ? new Date() : latestRecordDate;

    const thisMonthStart = startOfMonth(referenceDate);
    const lastMonthStart = startOfMonth(subMonths(referenceDate, 1));
    const lastMonthEnd = endOfMonth(subMonths(referenceDate, 1));

    // Use allRecords for history peek-back
    const sourceRecords = allRecords 
      ? allRecords.filter(r => normalizeKey(r.serviceName) === serviceKey) 
      : serviceRecords;

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

    const projectedThisMonth = isCurrentMonth 
        ? (thisMonthCost / daysElapsed) * daysInMonth 
        : thisMonthCost;

    const change = lastMonthCost > 0 ? ((projectedThisMonth - lastMonthCost) / lastMonthCost) * 100 : 0;
    const diff = projectedThisMonth - lastMonthCost;

    // RG breakdown for this service comparison
    const rgMap = new Map<string, { thisMonth: number; lastMonth: number }>();
    sourceRecords.forEach((r) => {
      const d = parseISO(r.usageDate);
      const rgName = fallbackGroup(r.resourceGroup);
      if (!rgMap.has(rgName)) rgMap.set(rgName, { thisMonth: 0, lastMonth: 0 });
      const entry = rgMap.get(rgName)!;
      if (d >= thisMonthStart && d <= endOfMonth(referenceDate)) entry.thisMonth += r.cost;
      else if (isWithinInterval(d, { start: lastMonthStart, end: lastMonthEnd })) entry.lastMonth += r.cost;
    });

    const rgBreakdown = Array.from(rgMap.entries()).map(([rg, costs]) => {
      const projected = isCurrentMonth ? (costs.thisMonth / daysElapsed) * daysInMonth : costs.thisMonth;
      const svcChange = costs.lastMonth > 0 ? ((projected - costs.lastMonth) / costs.lastMonth) * 100 : 0;
      return { rg, thisMonth: Math.round(projected * 100) / 100, lastMonth: Math.round(costs.lastMonth * 100) / 100, change: Math.round(svcChange * 10) / 10 };
    }).filter(s => s.thisMonth > 0 || s.lastMonth > 0).sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 6);

    return {
      thisMonthActual: Math.round(thisMonthCost * 100) / 100,
      lastMonthTotal: Math.round(lastMonthCost * 100) / 100,
      projected: Math.round(projectedThisMonth * 100) / 100,
      change: Math.round(change * 10) / 10,
      diff: Math.round(diff * 100) / 100,
      daysElapsed,
      daysInMonth,
      isCurrentMonth,
      rgBreakdown,
      thisMonthLabel: format(thisMonthStart, "MMM yyyy"),
      lastMonthLabel: format(lastMonthStart, "MMM yyyy"),
    };
  }, [records, allRecords, serviceRecords, serviceKey]);

  const heroInsight = useMemo(() => {
    const topPlan = planBreakdown[0];
    const topGroup = resourceGroupBreakdown[0];
    if (!topPlan && !topGroup) return null;

    return {
      headline: topPlan
        ? `${displayName} is mostly driven by ${topPlan.plan}`
        : `${displayName} cost is concentrated in one scope`,
      description: topPlan && topGroup
        ? `${topPlan.plan} contributes ${formatINR(topPlan.cost, 0)} while ${topGroup.resourceGroup} is the biggest resource group at ${formatINR(topGroup.cost, 0)}.`
        : topPlan
          ? `${topPlan.plan} contributes ${formatINR(topPlan.cost, 0)} of the total spend.`
          : `${topGroup?.resourceGroup} contributes ${formatINR(topGroup?.cost ?? 0, 0)} of the total spend.`,
    };
  }, [displayName, planBreakdown, resourceGroupBreakdown]);

  return (
    <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-6">
      <div className="rounded-[28px] border border-border/60 bg-gradient-to-br from-card/80 via-background to-card/50 p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-medium text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
              Service drilldown
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{displayName}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {resourceBreakdown.length} resources · {planBreakdown.length} plan tiers · {resourceGroupBreakdown.length} resource groups
                </p>
              </div>
            </div>
            {heroInsight && (
              <div className="max-w-2xl rounded-2xl border border-border/50 bg-card/50 px-4 py-3 shadow-sm">
                <p className="text-lg font-semibold text-foreground">{heroInsight.headline}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{heroInsight.description}</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 lg:max-w-md lg:justify-end">
            {[
              { label: "Total Cost", value: formatINR(totalCost) },
              { label: "Top Plan", value: planBreakdown[0]?.plan ?? "None" },
              { label: "Top Group", value: resourceGroupBreakdown[0]?.resourceGroup ?? "None" },
            ].map((item) => (
              <div key={item.label} className="min-w-[150px] rounded-2xl border border-border/60 bg-card/60 px-4 py-3 shadow-sm backdrop-blur">
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-lg font-bold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm space-y-4">
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

        <div className={`rounded-2xl p-4 border ${monthComparison.change > 2 ? "border-destructive/30 bg-destructive/5" : monthComparison.change < -2 ? "border-kpi-up/30 bg-kpi-up/5" : "border-border bg-secondary/20"}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{monthComparison.isCurrentMonth ? `Projected ${monthComparison.thisMonthLabel} vs ${monthComparison.lastMonthLabel}` : `${monthComparison.thisMonthLabel} vs ${monthComparison.lastMonthLabel}`}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-foreground">{formatINR(monthComparison.projected)}</span>
                <span className="text-sm text-muted-foreground">vs {formatINR(monthComparison.lastMonthTotal)}</span>
              </div>
            </div>
            <div className={`text-right px-3 py-2 rounded-xl ${monthComparison.change > 2 ? "bg-destructive/10 text-destructive" : monthComparison.change < -2 ? "bg-kpi-up/10 text-kpi-up" : "bg-secondary text-muted-foreground"}`}>
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

        {monthComparison.rgBreakdown.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">Change by Resource Group</p>
            <div className="space-y-2">
              {monthComparison.rgBreakdown.map((item) => (
                <div key={item.rg} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-md hover:bg-secondary/20 transition-colors">
                  <span className="text-foreground font-medium truncate max-w-[150px]">{item.rg}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{formatINR(item.lastMonth, 0)} → {formatINR(item.thisMonth, 0)}</span>
                    <span className={`font-semibold min-w-[60px] text-right ${item.change > 2 ? "text-destructive" : item.change < -2 ? "text-kpi-up" : "text-muted-foreground"}`}>
                      {item.change > 0 ? "+" : ""}{item.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Cost", value: formatINR(totalCost), icon: IndianRupee, tone: "from-sky-500/15 to-sky-500/5 text-sky-700" },
          { label: "Resources", value: String(resourceBreakdown.length), icon: Package2, tone: "from-emerald-500/15 to-emerald-500/5 text-emerald-700" },
          { label: "Plan Tiers", value: String(planBreakdown.length), icon: Layers3, tone: "from-amber-500/15 to-amber-500/5 text-amber-700" },
          { label: "Locations", value: String(locationBreakdown.length), icon: MapPin, tone: "from-violet-500/15 to-violet-500/5 text-violet-700" },
        ].map((card) => (
          <div key={card.label} className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{card.label}</p>
                <p className="mt-3 text-2xl font-black tracking-tight text-foreground">{card.value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Daily Spend Pattern</h2>
              <p className="text-sm text-muted-foreground">Track how this service is consuming budget over the selected date range.</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => exportToCsv(serviceRecords, `${displayName}-service-detail`)}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="serviceDrilldownGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(172 66% 45%)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(172 66% 45%)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: chartTheme.text, fontSize: 11 }} tickFormatter={(value) => format(parseISO(value), "MMM d")} />
                <YAxis tick={{ fill: chartTheme.text, fontSize: 11 }} tickFormatter={(value) => formatINRShort(value)} />
                <Tooltip
                  contentStyle={{ backgroundColor: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 12, color: chartTheme.tooltipText }}
                  labelFormatter={(value) => format(parseISO(value as string), "MMM d, yyyy")}
                  formatter={(value: number) => [formatINR(value), "Cost"]}
                />
                <Area type="monotone" dataKey="cost" stroke="hsl(172 66% 45%)" strokeWidth={2.5} fill="url(#serviceDrilldownGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-foreground">Plan Tier Mix</h2>
              <p className="text-sm text-muted-foreground">See which pricing tier is responsible for most of the spend.</p>
            </div>
            <div className="space-y-3">
              {planBreakdown.map((plan, index) => (
                <div key={plan.plan} className="rounded-2xl border border-border/50 bg-accent/20 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span className="font-medium text-foreground">{plan.plan}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">{formatINR(plan.cost, 0)}</span>
                  </div>
                  <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{plan.resources} resources</span>
                    <span>{plan.share.toFixed(1)}% of service spend</span>
                  </div>
                  <Progress value={plan.share} className="h-2 [&>div]:bg-emerald-500" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-foreground">Regional Split</h2>
              <p className="text-sm text-muted-foreground">Quick view of which regions are consuming this service.</p>
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={locationBreakdown} dataKey="cost" nameKey="location" innerRadius={48} outerRadius={78} paddingAngle={3} strokeWidth={0}>
                    {locationBreakdown.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 12, color: chartTheme.tooltipText }}
                    formatter={(value: number) => [formatINR(value), "Cost"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-2">
              {locationBreakdown.map((location, index) => (
                <div key={location.location} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                    <span className="text-muted-foreground">{location.location}</span>
                  </div>
                  <span className="font-semibold text-foreground">{formatINR(location.cost, 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-foreground">Resource Group Breakdown</h2>
            <p className="text-sm text-muted-foreground">Find the business area where this service is concentrated.</p>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceGroupBreakdown} layout="vertical" margin={{ top: 4, right: 16, left: 32, bottom: 4 }}>
                <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fill: chartTheme.text, fontSize: 11 }} tickFormatter={(value) => formatINRShort(value)} />
                <YAxis type="category" dataKey="resourceGroup" tick={{ fill: chartTheme.text, fontSize: 11 }} width={150} />
                <Tooltip
                  contentStyle={{ backgroundColor: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 12, color: chartTheme.tooltipText }}
                  formatter={(value: number) => [formatINR(value), "Cost"]}
                />
                <Bar dataKey="cost" radius={[0, 10, 10, 0]} fill="hsl(220 90% 60%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-foreground">Where To Look First</h2>
            <p className="text-sm text-muted-foreground">The highest-impact resources and tiers are surfaced first for faster investigation.</p>
          </div>
          <div className="space-y-3">
            {resourceBreakdown.slice(0, 4).map((resource, index) => (
              <div key={resource.resourceName} className="rounded-2xl border border-border/50 bg-accent/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">{resource.resourceName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {resource.resourcePlan} · {resource.resourceGroup} · {resource.location}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-card border border-border/50 px-3 py-2 text-right shadow-sm">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Rank {index + 1}</p>
                    <p className="mt-1 text-sm font-bold text-foreground">{formatINR(resource.totalCost, 0)}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Avg/day {formatINR(resource.avgDailyCost, 2)}</span>
                  <span>Peak {formatINR(resource.maxDailyCost, 2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-foreground">Resource-Level Breakup</h2>
          <p className="text-sm text-muted-foreground">Click a row to inspect the resource trend behind this service.</p>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <div className="col-span-1" />
            <div className="col-span-3">Resource</div>
            <div className="col-span-2">Tier</div>
            <div className="col-span-2">Resource Group</div>
            <div className="col-span-1">Location</div>
            <div className="col-span-1 text-right">Avg/Day</div>
            <div className="col-span-1 text-right">Peak</div>
            <div className="col-span-1 text-right">Total</div>
          </div>

          {resourceBreakdown.map((resource, index) => (
            <div key={resource.resourceName} className="rounded-2xl border border-border/50 bg-accent/10">
              <button
                type="button"
                onClick={() => setExpandedResource((current) => current === resource.resourceName ? null : resource.resourceName)}
                className="grid w-full grid-cols-12 items-center gap-2 px-3 py-4 text-left transition-colors hover:bg-accent/20"
              >
                <div className="col-span-1">
                  {expandedResource === resource.resourceName ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="col-span-3">
                  <p className="font-semibold text-foreground">{resource.resourceName}</p>
                  <p className="text-xs text-muted-foreground">{resource.resourceType}</p>
                </div>
                <div className="col-span-2 text-sm text-foreground">{resource.resourcePlan}</div>
                <div className="col-span-2 text-sm text-muted-foreground">{resource.resourceGroup}</div>
                <div className="col-span-1 text-sm text-muted-foreground">{resource.location}</div>
                <div className="col-span-1 text-right text-sm text-foreground">{formatINR(resource.avgDailyCost, 2)}</div>
                <div className="col-span-1 text-right text-sm text-amber-700">{formatINR(resource.maxDailyCost, 2)}</div>
                <div className="col-span-1 text-right text-sm font-bold text-foreground">{formatINR(resource.totalCost, 0)}</div>
              </button>

              <AnimatePresence>
                {expandedResource === resource.resourceName && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-border/50 bg-card/50"
                  >
                    <div className="grid grid-cols-1 gap-5 p-4 xl:grid-cols-[1.1fr_0.9fr]">
                      <div className="h-[220px] rounded-2xl border border-border/50 bg-accent/20 p-3">
                        <p className="mb-3 text-sm font-semibold text-foreground">Daily resource trend</p>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={resource.dailyCosts} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id={`resource-trend-${index}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.35} />
                                <stop offset="95%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fill: chartTheme.text, fontSize: 10 }} tickFormatter={(value) => format(parseISO(value), "MMM d")} />
                            <YAxis tick={{ fill: chartTheme.text, fontSize: 10 }} tickFormatter={(value) => formatINRShort(value)} />
                            <Tooltip
                              contentStyle={{ backgroundColor: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 12, color: chartTheme.tooltipText }}
                              labelFormatter={(value) => format(parseISO(value as string), "MMM d, yyyy")}
                              formatter={(value: number) => [formatINR(value), "Cost"]}
                            />
                            <Area type="monotone" dataKey="cost" stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={2.2} fill={`url(#resource-trend-${index})`} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="rounded-2xl border border-border/50 bg-accent/20 p-3">
                        <p className="mb-3 text-sm font-semibold text-foreground">Daily cost breakdown</p>
                        <div className="max-h-[220px] overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent">
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Cost</TableHead>
                                <TableHead className="text-right">Share</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {resource.dailyCosts.slice().reverse().map((row) => (
                                <TableRow key={row.date}>
                                  <TableCell>{format(parseISO(row.date), "MMM d, yyyy")}</TableCell>
                                  <TableCell className="text-right font-medium">{formatINR(row.cost, 2)}</TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    {resource.totalCost > 0 ? ((row.cost / resource.totalCost) * 100).toFixed(1) : "0.0"}%
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
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
