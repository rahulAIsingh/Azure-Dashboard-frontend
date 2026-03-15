import { useState, useMemo, useEffect, Fragment } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  GitCompareArrows,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTheme } from "@/components/ThemeProvider";
import { getChartTheme, CHART_COLORS } from "@/lib/chartTheme";
import { formatINR } from "@/lib/currency";
import { useLookups } from "@/hooks/useLookups";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { useFilteredRecords } from "@/hooks/useFilteredRecords";
import type { CostRecord } from "@/types/dashboardTypes";
import { KpiLoading, EmptyState, ErrorState } from "./LoadingState";

type DailyTrendDatum = { date: string } & Record<string, string | number>;
type ServiceComparisonDatum = { service: string } & Record<string, string | number>;
type ServiceCostEntry = { service: string; cost: number };
type PlanTierCostEntry = { tier: string; cost: number };
type GroupOption = { key: string; label: string; records: CostRecord[] };
type GroupStats = {
  key: string;
  name: string;
  color: string;
  totalCost: number;
  resourceCount: number;
  serviceCount: number;
  avgDaily: number;
  projectedMonthly: number;
  dailyCosts: Array<{ date: string; cost: number }>;
  costByService: ServiceCostEntry[];
  serviceCostMap: Map<string, ServiceCostEntry>;
  planTierCostMap: Map<string, Map<string, PlanTierCostEntry>>;
  topResources: Array<{ name: string; cost: number }>;
};
type AlignedPlanTierRow = {
  key: string;
  tier: string;
  matched: boolean;
  total: number;
  costsByGroup: Record<string, number>;
  status: string;
};
type AlignedServiceRow = {
  key: string;
  service: string;
  matched: boolean;
  total: number;
  costsByGroup: Record<string, number>;
  status: string;
  planTiers: AlignedPlanTierRow[];
  insight: string;
};

interface ResourceGroupCompareProps {
  records?: CostRecord[];
  onBack: () => void;
  initialGroups?: string[];
}

function normalizeKey(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function getCanonicalValue(value?: string | null, fallback = "Unclassified") {
  const trimmed = (value ?? "").trim();
  return trimmed || fallback;
}

function getPlanTierLabel(value?: string | null) {
  return getCanonicalValue(value, "Standard / Unspecified");
}

function buildAlignedPlanTierRows(serviceKey: string, groupStats: GroupStats[]): AlignedPlanTierRow[] {
  const rows = new Map<string, AlignedPlanTierRow>();

  groupStats.forEach((group) => {
    const tierMap = group.planTierCostMap.get(serviceKey);
    if (!tierMap) return;

    tierMap.forEach((tierEntry, tierKey) => {
      const existing = rows.get(tierKey);
      const costsByGroup = existing?.costsByGroup || {};
      costsByGroup[group.name] = Math.round(tierEntry.cost * 100) / 100;

      rows.set(tierKey, {
        key: tierKey,
        tier: existing?.tier || tierEntry.tier,
        matched: false,
        total: 0,
        costsByGroup,
        status: "",
      });
    });
  });

  return Array.from(rows.values()).map((row) => {
    const costsByGroup = Object.fromEntries(groupStats.map((group) => [group.name, row.costsByGroup[group.name] || 0]));
    const presentGroups = groupStats.filter((group) => (costsByGroup[group.name] || 0) > 0);
    const total = Object.values(costsByGroup).reduce((sum, cost) => sum + cost, 0);
    const matched = presentGroups.length > 1;

    return {
      key: row.key,
      tier: row.tier,
      matched,
      total,
      costsByGroup,
      status: matched ? "Matched" : (presentGroups[0] ? `Only in ${presentGroups[0].name}` : "No cost"),
    };
  }).sort((a, b) => {
    if (a.matched !== b.matched) return a.matched ? -1 : 1;
    if (b.total !== a.total) return b.total - a.total;
    return a.tier.localeCompare(b.tier);
  });
}

function getTopDriverInsight(service: string, planTiers: AlignedPlanTierRow[], groupStats: GroupStats[]) {
  const topTier = planTiers[0];
  if (!topTier) return `No plan tier data found for ${service}.`;

  const dominantGroup = groupStats
    .map((group) => ({ name: group.name, cost: topTier.costsByGroup[group.name] || 0 }))
    .sort((a, b) => b.cost - a.cost)[0];

  if (!dominantGroup || dominantGroup.cost <= 0) {
    return `No plan tier cost recorded for ${service}.`;
  }

  if (topTier.matched) {
    return `Highest cost driver for ${service}: ${topTier.tier} in ${dominantGroup.name}.`;
  }

  return `${dominantGroup.name} has no matching tier for ${service}; the highest cost driver is ${topTier.tier}.`;
}

function getGroupAccent(index: number) {
  if (index === 0) {
    return {
      panel: "border-primary/25 bg-primary/10",
      softPanel: "bg-primary/5",
      text: "text-primary",
      ring: "ring-primary/15",
    };
  }

  if (index === 1) {
    return {
      panel: "border-accent/25 bg-accent/10",
      softPanel: "bg-accent/5",
      text: "text-accent",
      ring: "ring-accent/15",
    };
  }

  return {
    panel: "border-border bg-secondary/50",
    softPanel: "bg-secondary/40",
    text: "text-foreground",
    ring: "ring-border/20",
  };
}

export function ResourceGroupCompare({ records: providedRecords, onBack, initialGroups = [] }: ResourceGroupCompareProps) {
  const { theme } = useTheme();
  const ct = useMemo(() => getChartTheme(), [theme]);
  const { filterParams } = useDashboardFilters();

  const comparisonFilters = useMemo(() => ({
    subscription: filterParams.subscription,
    service: filterParams.service,
    location: filterParams.location,
    startDate: filterParams.startDate,
    endDate: filterParams.endDate,
  }), [filterParams.endDate, filterParams.location, filterParams.service, filterParams.startDate, filterParams.subscription]);

  const { data: lookups, isLoading: isLoadingLookups } = useLookups(filterParams.subscription);
  const { data: fetchedRecords, isLoading: isLoadingRecords, error: recordsError } = useFilteredRecords(comparisonFilters);

  const [selectedGroups, setSelectedGroups] = useState<string[]>(() => initialGroups.map((group) => normalizeKey(group)).filter(Boolean));
  const [addingGroup, setAddingGroup] = useState(false);
  const [expandedServices, setExpandedServices] = useState<string[]>([]);

  const records = useMemo(
    () => (Array.isArray(providedRecords) && providedRecords.length > 0 ? providedRecords : (fetchedRecords || [])),
    [fetchedRecords, providedRecords],
  );

  const groupOptions = useMemo(() => {
    const options = new Map<string, GroupOption>();

    (lookups?.resourceGroups || []).forEach((group) => {
      const key = normalizeKey(group);
      if (!key) return;
      if (!options.has(key)) {
        options.set(key, { key, label: getCanonicalValue(group, "Unassigned"), records: [] });
      }
    });

    records.forEach((record) => {
      const key = normalizeKey(record.resourceGroup);
      if (!key) return;

      const existing = options.get(key);
      if (existing) {
        existing.records.push(record);
        existing.label = getCanonicalValue(record.resourceGroup, existing.label);
        return;
      }

      options.set(key, {
        key,
        label: getCanonicalValue(record.resourceGroup, "Unassigned"),
        records: [record],
      });
    });

    return Array.from(options.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [lookups?.resourceGroups, records]);

  const groupOptionsByKey = useMemo(() => new Map(groupOptions.map((group) => [group.key, group])), [groupOptions]);

  useEffect(() => {
    setSelectedGroups((prev) => {
      const validGroups = prev.filter((group) => groupOptionsByKey.has(group));
      if (groupOptions.length < 2) return validGroups;
      if (validGroups.length >= 2) return validGroups;

      const additions = groupOptions
        .map((group) => group.key)
        .filter((group) => !validGroups.includes(group))
        .slice(0, 2 - validGroups.length);

      return [...validGroups, ...additions];
    });
  }, [groupOptions, groupOptionsByKey]);

  useEffect(() => {
    setExpandedServices((prev) => prev.filter((serviceKey) => serviceKey));
  }, [selectedGroups]);

  const availableGroups = useMemo(
    () => groupOptions.filter((group) => !selectedGroups.includes(group.key)),
    [groupOptions, selectedGroups],
  );

  const addGroup = (groupKey: string) => {
    setSelectedGroups((prev) => [...prev, groupKey]);
    setAddingGroup(false);
  };

  const removeGroup = (groupKey: string) => {
    if (selectedGroups.length <= 2) return;
    setSelectedGroups((prev) => prev.filter((group) => group !== groupKey));
  };

  const toggleService = (serviceKey: string) => {
    setExpandedServices((prev) => (
      prev.includes(serviceKey)
        ? prev.filter((key) => key !== serviceKey)
        : [...prev, serviceKey]
    ));
  };

  const groupStats = useMemo<GroupStats[]>(() => {
    return selectedGroups.map((groupKey, idx) => {
      const group = groupOptionsByKey.get(groupKey);
      const groupRecords = group?.records || [];
      const totalCost = groupRecords.reduce((sum, record) => sum + record.cost, 0);
      const resourceNames = new Set(groupRecords.map((record) => normalizeKey(record.resourceName)).filter(Boolean));
      const services = new Set(groupRecords.map((record) => normalizeKey(getCanonicalValue(record.serviceName))).filter(Boolean));

      const dailyMap = new Map<string, number>();
      const serviceCostMap = new Map<string, ServiceCostEntry>();
      const planTierCostMap = new Map<string, Map<string, PlanTierCostEntry>>();
      const resourceCostMap = new Map<string, number>();

      groupRecords.forEach((record) => {
        dailyMap.set(record.usageDate, (dailyMap.get(record.usageDate) || 0) + record.cost);

        const serviceLabel = getCanonicalValue(record.serviceName);
        const serviceKey = normalizeKey(serviceLabel);
        const serviceExisting = serviceCostMap.get(serviceKey);
        serviceCostMap.set(serviceKey, {
          service: serviceExisting?.service || serviceLabel,
          cost: (serviceExisting?.cost || 0) + record.cost,
        });

        const tierLabel = getPlanTierLabel(record.resourcePlan);
        const tierKey = normalizeKey(tierLabel);
        const tierMap = planTierCostMap.get(serviceKey) || new Map<string, PlanTierCostEntry>();
        const tierExisting = tierMap.get(tierKey);
        tierMap.set(tierKey, {
          tier: tierExisting?.tier || tierLabel,
          cost: (tierExisting?.cost || 0) + record.cost,
        });
        planTierCostMap.set(serviceKey, tierMap);

        const resourceName = getCanonicalValue(record.resourceName, "Unassigned Resource");
        resourceCostMap.set(resourceName, (resourceCostMap.get(resourceName) || 0) + record.cost);
      });

      const dailyCosts = Array.from(dailyMap, ([date, cost]) => ({ date, cost: Math.round(cost * 100) / 100 }))
        .sort((a, b) => a.date.localeCompare(b.date));
      const avgDaily = dailyCosts.length > 0 ? totalCost / dailyCosts.length : 0;

      const costByService = Array.from(serviceCostMap.values())
        .map((entry) => ({ service: entry.service, cost: Math.round(entry.cost * 100) / 100 }))
        .sort((a, b) => b.cost - a.cost);

      const topResources = Array.from(resourceCostMap, ([name, cost]) => ({ name, cost: Math.round(cost * 100) / 100 }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 5);

      return {
        key: groupKey,
        name: group?.label || groupKey,
        color: CHART_COLORS[idx % CHART_COLORS.length],
        totalCost: Math.round(totalCost * 100) / 100,
        resourceCount: resourceNames.size,
        serviceCount: services.size,
        avgDaily: Math.round(avgDaily * 100) / 100,
        projectedMonthly: Math.round(avgDaily * 30 * 100) / 100,
        dailyCosts,
        costByService,
        serviceCostMap,
        planTierCostMap,
        topResources,
      };
    });
  }, [groupOptionsByKey, selectedGroups]);

  const mergedDailyTrend = useMemo(() => {
    const allDates = new Set<string>();
    groupStats.forEach((group) => group.dailyCosts.forEach((datum) => allDates.add(datum.date)));

    return Array.from(allDates).sort().map((date) => {
      const entry: DailyTrendDatum = { date };
      groupStats.forEach((group) => {
        const found = group.dailyCosts.find((datum) => datum.date === date);
        entry[group.name] = found ? found.cost : 0;
      });
      return entry;
    });
  }, [groupStats]);

  const alignedServiceRows = useMemo<AlignedServiceRow[]>(() => {
    const rows = new Map<string, { key: string; service: string; costsByGroup: Record<string, number> }>();

    groupStats.forEach((group) => {
      group.serviceCostMap.forEach((serviceEntry, serviceKey) => {
        const existing = rows.get(serviceKey);
        const costsByGroup = existing?.costsByGroup || {};
        costsByGroup[group.name] = Math.round(serviceEntry.cost * 100) / 100;

        rows.set(serviceKey, {
          key: serviceKey,
          service: existing?.service || serviceEntry.service,
          costsByGroup,
        });
      });
    });

    return Array.from(rows.values()).map((row) => {
      const costsByGroup = Object.fromEntries(groupStats.map((group) => [group.name, row.costsByGroup[group.name] || 0]));
      const presentGroups = groupStats.filter((group) => (costsByGroup[group.name] || 0) > 0);
      const total = Object.values(costsByGroup).reduce((sum, cost) => sum + cost, 0);
      const matched = presentGroups.length > 1;
      const planTiers = buildAlignedPlanTierRows(row.key, groupStats);

      return {
        key: row.key,
        service: row.service,
        matched,
        total,
        costsByGroup,
        status: matched ? "Matched" : (presentGroups[0] ? `Only in ${presentGroups[0].name}` : "No cost"),
        planTiers,
        insight: getTopDriverInsight(row.service, planTiers, groupStats),
      };
    }).sort((a, b) => {
      if (a.matched !== b.matched) return a.matched ? -1 : 1;
      if (b.total !== a.total) return b.total - a.total;
      return a.service.localeCompare(b.service);
    });
  }, [groupStats]);

  const mergedServiceData = useMemo(() => {
    return alignedServiceRows.map((row) => {
      const entry: ServiceComparisonDatum = { service: row.service };
      groupStats.forEach((group) => {
        entry[group.name] = row.costsByGroup[group.name] || 0;
      });
      return entry;
    });
  }, [alignedServiceRows, groupStats]);

  const comparisonOverview = useMemo(() => {
    if (groupStats.length < 2) return null;

    const [leftGroup, rightGroup] = groupStats;
    const difference = leftGroup.totalCost - rightGroup.totalCost;
    const higherGroup = difference >= 0 ? leftGroup : rightGroup;
    const lowerGroup = difference >= 0 ? rightGroup : leftGroup;
    const sharedServices = alignedServiceRows.filter((row) => row.matched).length;
    const uniqueServices = alignedServiceRows.length - sharedServices;
    const spendRatio = lowerGroup.totalCost > 0 ? higherGroup.totalCost / lowerGroup.totalCost : null;

    const biggestGaps = alignedServiceRows
      .map((row) => {
        const rowDifference = (row.costsByGroup[leftGroup.name] || 0) - (row.costsByGroup[rightGroup.name] || 0);
        return {
          key: row.key,
          service: row.service,
          difference: rowDifference,
          absDifference: Math.abs(rowDifference),
          leadingGroup: rowDifference >= 0 ? leftGroup.name : rightGroup.name,
          topTier: row.planTiers[0]?.tier || "Standard / Unspecified",
        };
      })
      .sort((a, b) => b.absDifference - a.absDifference)
      .slice(0, 3);

    return {
      leftGroup,
      rightGroup,
      difference,
      higherGroup,
      lowerGroup,
      sharedServices,
      uniqueServices,
      spendRatio,
      biggestGaps,
    };
  }, [alignedServiceRows, groupStats]);

  const maxCost = Math.max(...groupStats.map((group) => group.totalCost), 1);
  const isUsingProvidedRecords = Array.isArray(providedRecords) && providedRecords.length > 0;
  const showLoadingState = isLoadingLookups || (!isUsingProvidedRecords && isLoadingRecords);
  const compareError = isUsingProvidedRecords ? null : recordsError;

  if (showLoadingState) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Overview
        </Button>
        <KpiLoading />
        <p className="text-sm text-muted-foreground text-center">Loading resource group data...</p>
      </div>
    );
  }

  if (compareError) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Overview
        </Button>
        <ErrorState message="Failed to load cost records" />
      </div>
    );
  }

  if (groupOptions.length < 2) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Overview
        </Button>
        <EmptyState
          message="Not Enough Resource Groups"
          description="You need at least two resource groups in your subscription to use the comparison view."
        />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <GitCompareArrows className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Compare Resource Groups</h2>
            </div>
            <p className="text-sm text-muted-foreground">Side-by-side analysis of {selectedGroups.length} groups</p>
          </div>
        </div>
        {availableGroups.length > 0 && (
          addingGroup ? (
            <div className="flex items-center gap-2">
              <Select onValueChange={addGroup}>
                <SelectTrigger className="w-[220px] bg-card border-border">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {availableGroups.map((group) => (
                    <SelectItem key={group.key} value={group.key}>{group.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => setAddingGroup(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAddingGroup(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Group
            </Button>
          )
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {groupStats.map((group) => (
          <div key={group.key} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-card/80">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
            <span className="text-sm font-medium text-foreground">{group.name}</span>
            {selectedGroups.length > 2 && (
              <button onClick={() => removeGroup(group.key)} className="text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {comparisonOverview && (
        <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Compare spotlight
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                  {comparisonOverview.higherGroup.name} is spending {formatINR(Math.abs(comparisonOverview.difference), 2)} more
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {comparisonOverview.spendRatio
                    ? `${comparisonOverview.higherGroup.name} is ${comparisonOverview.spendRatio.toFixed(1)}x the spend of ${comparisonOverview.lowerGroup.name}.`
                    : `${comparisonOverview.lowerGroup.name} has no comparable spend in the selected scope.`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 min-w-[260px]">
              <div className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Shared Services</div>
                <div className="mt-2 text-2xl font-semibold text-foreground">{comparisonOverview.sharedServices}</div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Unique Services</div>
                <div className="mt-2 text-2xl font-semibold text-foreground">{comparisonOverview.uniqueServices}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {[comparisonOverview.leftGroup, comparisonOverview.rightGroup].map((group, index) => {
              const accent = getGroupAccent(index);
              const isLeader = group.name === comparisonOverview.higherGroup.name;
              return (
                <div key={group.key} className={`rounded-2xl border px-5 py-6 ${accent.panel}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        <div className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: group.color }} />
                        Group {index + 1}
                      </div>
                      <h4 className="mt-4 text-2xl font-semibold text-foreground">{group.name}</h4>
                      <div className="mt-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Total Cost</div>
                      <div className="mt-2 text-3xl font-semibold text-foreground tabular-nums">{formatINR(group.totalCost, 2)}</div>
                    </div>
                    <div className="flex flex-col items-end gap-10">
                      <div className={`rounded-full px-3 py-1 text-xs font-medium ${accent.softPanel} ${accent.text}`}>
                        {isLeader ? "Higher spend" : "Lower spend"}
                      </div>
                      <div className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3 text-right min-w-[104px]">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Avg / Day</div>
                        <div className="mt-1 text-xl font-semibold text-foreground tabular-nums">{formatINR(group.avgDaily, 2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Gap Summary</div>
                  <div className="mt-2 text-2xl font-semibold text-foreground tabular-nums">{formatINR(Math.abs(comparisonOverview.difference), 2)}</div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {comparisonOverview.biggestGaps.map((gap) => (
                  <div key={gap.key} className="rounded-2xl border border-border/50 bg-background/60 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-lg font-semibold text-foreground truncate">{gap.service}</div>
                        <div className="mt-1 text-sm text-muted-foreground truncate">
                          Biggest tier driver: {gap.topTier}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          {gap.leadingGroup}
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-foreground tabular-nums">{formatINR(gap.absDifference, 2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(selectedGroups.length, 4))}, minmax(0, 1fr))` }}>
        {groupStats.map((group) => (
          <motion.div
            key={group.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-lg p-4 space-y-3"
            style={{ borderTopColor: group.color, borderTopWidth: 3 }}
          >
            <h4 className="text-sm font-bold text-foreground">{group.name}</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Cost</span>
                <span className="font-bold text-foreground">{formatINR(group.totalCost, 2)}</span>
              </div>
              <Progress value={(group.totalCost / maxCost) * 100} className="h-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(group.totalCost / maxCost) * 100}%`, backgroundColor: group.color }}
                />
              </Progress>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Resources</span><span className="text-foreground font-medium">{group.resourceCount}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Services</span><span className="text-foreground font-medium">{group.serviceCount}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Avg/Day</span><span className="text-foreground font-medium">{formatINR(group.avgDaily, 2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Proj/Mo</span><span className="text-accent font-medium">{formatINR(group.projectedMonthly, 2)}</span></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass-card rounded-lg p-5">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">Daily Cost Trend - Comparison</h3>
        <div className="h-[300px]">
          {mergedDailyTrend.length === 0 ? (
            <EmptyState message="No daily data" description="No records found for the selected resource groups." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mergedDailyTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  {groupStats.map((group) => (
                    <linearGradient key={group.key} id={`grad-${group.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={group.color} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={group.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: ct.text, fontSize: 10 }}
                  tickFormatter={(value) => {
                    try {
                      return format(parseISO(value), "MMM d");
                    } catch {
                      return value;
                    }
                  }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fill: ct.text, fontSize: 11 }} tickFormatter={(value) => `INR ${value}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 8, color: ct.tooltipText }}
                  labelFormatter={(value) => {
                    try {
                      return format(parseISO(value as string), "MMM d, yyyy");
                    } catch {
                      return value;
                    }
                  }}
                  formatter={(value: number) => [formatINR(value, 2), ""]}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: ct.text }} />
                {groupStats.map((group) => (
                  <Area
                    key={group.key}
                    type="monotone"
                    dataKey={group.name}
                    stroke={group.color}
                    strokeWidth={2}
                    fill={`url(#grad-${group.key})`}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="glass-card rounded-lg p-5">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">Cost by Service - Comparison</h3>
        <div className="h-[300px]">
          {mergedServiceData.length === 0 ? (
            <EmptyState message="No service data" description="No service costs found for the selected resource groups." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mergedServiceData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                <XAxis dataKey="service" tick={{ fill: ct.text, fontSize: 11 }} />
                <YAxis tick={{ fill: ct.text, fontSize: 11 }} tickFormatter={(value) => `INR ${value}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 8, color: ct.tooltipText }}
                  formatter={(value: number) => [formatINR(value, 2), ""]}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: ct.text }} />
                {groupStats.map((group) => (
                  <Bar key={group.key} dataKey={group.name} fill={group.color} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="glass-card rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-sm font-semibold text-muted-foreground">Like-for-Like Service Alignment</h3>
          <p className="text-xs text-muted-foreground">
            Expand a service to compare the plan tiers driving the cost. Matched services and tiers stay on top.
          </p>
        </div>
        {alignedServiceRows.length === 0 ? (
          <EmptyState message="No comparable service data" description="No service costs were found for the selected resource groups." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs">Service</TableHead>
                {groupStats.map((group, index) => {
                  const accent = getGroupAccent(index);
                  return (
                    <TableHead key={group.key} className="text-right">
                      <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium ${accent.panel}`}>
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.color }} />
                        {group.name}
                      </div>
                    </TableHead>
                  );
                })}
                {groupStats.length === 2 && <TableHead className="text-muted-foreground text-xs text-right">Difference</TableHead>}
                <TableHead className="text-muted-foreground text-xs text-right">Match Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alignedServiceRows.map((row) => {
                const isExpanded = expandedServices.includes(row.key);
                const difference = groupStats.length === 2
                  ? (row.costsByGroup[groupStats[0].name] || 0) - (row.costsByGroup[groupStats[1].name] || 0)
                  : 0;

                return (
                  <Fragment key={row.key}>
                    <TableRow className="border-border/20 hover:bg-secondary/20">
                      <TableCell className="text-sm font-medium text-foreground">
                        <button
                          type="button"
                          onClick={() => toggleService(row.key)}
                          className="flex items-center gap-3 rounded-2xl border border-border/40 bg-background/70 px-3 py-2 text-left w-full transition-colors hover:bg-background"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="min-w-0">
                            <div className="truncate">{row.service}</div>
                            <div className="text-[10px] text-primary/80">
                              {row.planTiers.length} tier{row.planTiers.length === 1 ? "" : "s"}
                            </div>
                          </div>
                        </button>
                      </TableCell>
                      {groupStats.map((group, index) => {
                        const accent = getGroupAccent(index);
                        const value = row.costsByGroup[group.name] || 0;
                        const isLeading = value === Math.max(...groupStats.map((entry) => row.costsByGroup[entry.name] || 0)) && value > 0;
                        return (
                          <TableCell key={`${row.key}-${group.key}`} className="text-right">
                            <div className={`rounded-2xl border px-3 py-2 text-right ${isLeading ? accent.panel : "border-border/50 bg-background/80"}`}>
                              <div className="text-sm font-semibold text-foreground">{formatINR(value, 2)}</div>
                              <div className="text-[10px] text-muted-foreground">{value > 0 ? "active spend" : "no spend"}</div>
                            </div>
                          </TableCell>
                        );
                      })}
                      {groupStats.length === 2 && (
                        <TableCell className={`text-right text-sm font-medium ${difference >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                          {difference >= 0 ? "+" : "-"}{formatINR(Math.abs(difference), 2)}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <Badge variant={row.matched ? "secondary" : "outline"} className="justify-center">
                          {row.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="border-border/20 bg-secondary/10 hover:bg-secondary/10">
                        <TableCell colSpan={groupStats.length + (groupStats.length === 2 ? 3 : 2)} className="p-0">
                          <div className="px-4 py-4 space-y-3">
                            <div className="rounded-2xl border border-border/50 bg-background/75 px-4 py-3 text-xs text-muted-foreground">
                              {row.insight}
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow className="border-border/20 hover:bg-transparent">
                                  <TableHead className="text-muted-foreground text-[11px]">Plan Tier</TableHead>
                                  {groupStats.map((group) => (
                                    <TableHead key={`${row.key}-${group.key}-tier`} className="text-muted-foreground text-[11px] text-right">{group.name}</TableHead>
                                  ))}
                                  {groupStats.length === 2 && <TableHead className="text-muted-foreground text-[11px] text-right">Difference</TableHead>}
                                  <TableHead className="text-muted-foreground text-[11px] text-right">Tier Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {row.planTiers.map((tier) => {
                                  const tierDifference = groupStats.length === 2
                                    ? (tier.costsByGroup[groupStats[0].name] || 0) - (tier.costsByGroup[groupStats[1].name] || 0)
                                    : 0;

                                  return (
                                    <TableRow key={`${row.key}-${tier.key}`} className="border-border/10 hover:bg-secondary/20">
                                      <TableCell className="text-xs font-medium text-foreground">
                                        <div className="rounded-xl border border-border/40 bg-background/70 px-3 py-2 inline-flex">
                                          {tier.tier}
                                        </div>
                                      </TableCell>
                                      {groupStats.map((group, index) => {
                                        const accent = getGroupAccent(index);
                                        const value = tier.costsByGroup[group.name] || 0;
                                        const isLeading = value === Math.max(...groupStats.map((entry) => tier.costsByGroup[entry.name] || 0)) && value > 0;
                                        return (
                                          <TableCell key={`${row.key}-${tier.key}-${group.key}`} className="text-right">
                                            <div className={`rounded-xl border px-3 py-2 text-right ${isLeading ? accent.panel : "border-border/50 bg-background/80"}`}>
                                              <div className="text-xs font-semibold text-foreground">{formatINR(value, 2)}</div>
                                            </div>
                                          </TableCell>
                                        );
                                      })}
                                      {groupStats.length === 2 && (
                                        <TableCell className={`text-right text-xs font-medium ${tierDifference >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                                          {tierDifference >= 0 ? "+" : "-"}{formatINR(Math.abs(tierDifference), 2)}
                                        </TableCell>
                                      )}
                                      <TableCell className="text-right">
                                        <Badge variant={tier.matched ? "secondary" : "outline"} className="justify-center">
                                          {tier.status}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="glass-card rounded-lg p-5">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">Top Resources per Group</h3>
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(selectedGroups.length, 3)}, minmax(0, 1fr))` }}>
          {groupStats.map((group) => (
            <div key={group.key}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: group.color }} />
                <span className="text-xs font-semibold text-foreground">{group.name}</span>
              </div>
              {group.topResources.length === 0 ? (
                <p className="text-xs text-muted-foreground">No resources found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30 hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-xs">Resource</TableHead>
                      <TableHead className="text-muted-foreground text-xs text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.topResources.map((resource) => (
                      <TableRow key={resource.name} className="border-border/20 hover:bg-secondary/20">
                        <TableCell className="text-xs text-foreground truncate max-w-[140px]">{resource.name}</TableCell>
                        <TableCell className="text-xs text-right font-medium text-foreground">{formatINR(resource.cost, 2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
