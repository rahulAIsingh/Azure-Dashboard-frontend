import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, TrendingUp, TrendingDown, ChevronDown, ChevronRight, Layers, Zap, Shield } from "lucide-react";
import type { CostRecord } from "@/types/dashboardTypes";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatINR } from "@/lib/currency";

interface CostAnomaliesProps {
  records: CostRecord[];
}

interface Anomaly {
  date: string;
  cost: number;
  avgCost: number;
  deviation: number;
  direction: "spike" | "drop";
  severity: "low" | "medium" | "high" | "critical";
  affectedGroups: { name: string; cost: number; contribution: number }[];
  topService: string;
}

const severityConfig = {
  low: { label: "Low", color: "bg-muted text-muted-foreground", icon: Shield },
  medium: { label: "Medium", color: "bg-chart-4/15 text-chart-4", icon: AlertTriangle },
  high: { label: "High", color: "bg-destructive/15 text-destructive", icon: Zap },
  critical: { label: "Critical", color: "bg-destructive/25 text-destructive", icon: Zap },
};

function getSeverity(deviation: number): Anomaly["severity"] {
  const abs = Math.abs(deviation);
  if (abs > 3) return "critical";
  if (abs > 2.5) return "high";
  if (abs > 2) return "medium";
  return "low";
}

export function CostAnomalies({ records }: CostAnomaliesProps) {
  const [expandedAnomaly, setExpandedAnomaly] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "spike" | "drop">("all");

  const anomalies = useMemo(() => {
    const dailyMap = new Map<string, number>();
    records.forEach((r) => dailyMap.set(r.usageDate, (dailyMap.get(r.usageDate) || 0) + r.cost));
    const days = Array.from(dailyMap, ([date, cost]) => ({ date, cost })).sort((a, b) => a.date.localeCompare(b.date));

    if (days.length < 7) return [];

    // Build per-day per-RG and per-service maps
    const dayRGMap = new Map<string, Map<string, number>>();
    const daySvcMap = new Map<string, Map<string, number>>();
    records.forEach((r) => {
      if (!dayRGMap.has(r.usageDate)) dayRGMap.set(r.usageDate, new Map());
      if (!daySvcMap.has(r.usageDate)) daySvcMap.set(r.usageDate, new Map());
      const rgMap = dayRGMap.get(r.usageDate)!;
      const svcMap = daySvcMap.get(r.usageDate)!;
      rgMap.set(r.resourceGroup, (rgMap.get(r.resourceGroup) || 0) + r.cost);
      svcMap.set(r.serviceName, (svcMap.get(r.serviceName) || 0) + r.cost);
    });

    const results: Anomaly[] = [];
    for (let i = 7; i < days.length; i++) {
      const window = days.slice(i - 7, i);
      const avg = window.reduce((s, d) => s + d.cost, 0) / 7;
      const std = Math.sqrt(window.reduce((s, d) => s + Math.pow(d.cost - avg, 2), 0) / 7);
      const deviation = std > 0 ? (days[i].cost - avg) / std : 0;

      if (Math.abs(deviation) > 1.8) {
        const rgCosts = dayRGMap.get(days[i].date);
        const svcCosts = daySvcMap.get(days[i].date);
        const affectedGroups = rgCosts
          ? Array.from(rgCosts.entries())
            .map(([name, cost]) => ({ name, cost: Math.round(cost * 100) / 100, contribution: days[i].cost > 0 ? Math.round((cost / days[i].cost) * 100) : 0 }))
            .sort((a, b) => b.cost - a.cost)
            .slice(0, 4)
          : [];
        const topService = svcCosts
          ? Array.from(svcCosts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown"
          : "Unknown";

        results.push({
          date: days[i].date,
          cost: Math.round(days[i].cost * 100) / 100,
          avgCost: Math.round(avg * 100) / 100,
          deviation: Math.round(deviation * 100) / 100,
          direction: deviation > 0 ? "spike" : "drop",
          severity: getSeverity(deviation),
          affectedGroups,
          topService,
        });
      }
    }
    return results.slice(-8).reverse();
  }, [records]);

  const filtered = filter === "all" ? anomalies : anomalies.filter((a) => a.direction === filter);
  const spikeCount = anomalies.filter((a) => a.direction === "spike").length;
  const dropCount = anomalies.filter((a) => a.direction === "drop").length;
  const criticalCount = anomalies.filter((a) => a.severity === "critical" || a.severity === "high").length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-chart-4" />
          <h3 className="text-sm font-semibold text-muted-foreground">Cost Anomaly Detection</h3>
          {criticalCount > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{criticalCount} critical</Badge>
          )}
        </div>
        <div className="flex gap-1">
          {(["all", "spike", "drop"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] px-2 py-1 rounded-md transition-colors ${filter === f ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:bg-secondary"}`}
            >
              {f === "all" ? `All (${anomalies.length})` : f === "spike" ? `Spikes (${spikeCount})` : `Drops (${dropCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      {anomalies.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-md bg-secondary/30 p-2 text-center">
            <p className="text-lg font-bold text-foreground">{anomalies.length}</p>
            <p className="text-[10px] text-muted-foreground">Total Anomalies</p>
          </div>
          <div className="rounded-md bg-destructive/5 p-2 text-center">
            <p className="text-lg font-bold text-destructive">{spikeCount}</p>
            <p className="text-[10px] text-muted-foreground">Cost Spikes</p>
          </div>
          <div className="rounded-md bg-kpi-up/5 p-2 text-center">
            <p className="text-lg font-bold text-kpi-up">{dropCount}</p>
            <p className="text-[10px] text-muted-foreground">Cost Drops</p>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No anomalies detected in current period</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const sev = severityConfig[a.severity];
            const SevIcon = sev.icon;
            const isExpanded = expandedAnomaly === a.date;

            return (
              <div key={a.date}>
                <div
                  className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${a.direction === "spike" ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/10" : "border-kpi-up/30 bg-kpi-up/5 hover:bg-kpi-up/10"
                    }`}
                  onClick={() => setExpandedAnomaly(isExpanded ? null : a.date)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    {a.direction === "spike" ? (
                      <TrendingUp className="h-4 w-4 text-destructive" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-kpi-up" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{format(parseISO(a.date), "MMM d, yyyy")}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${sev.color}`}>
                          {sev.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">7-day avg: {formatINR(a.avgCost, 0)} · Top: {a.topService}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{formatINR(a.cost, 0)}</p>
                    <p className={`text-xs font-medium ${a.direction === "spike" ? "text-destructive" : "text-kpi-up"}`}>
                      {a.deviation > 0 ? "+" : ""}{a.deviation}σ
                    </p>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mx-2 mb-1 p-3 rounded-b-md bg-secondary/20 border border-t-0 border-border/20 space-y-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Layers className="h-3.5 w-3.5" />
                          <span className="font-medium">Affected Resource Groups</span>
                        </div>
                        <div className="space-y-2">
                          {a.affectedGroups.map((rg) => (
                            <div key={rg.name} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-foreground font-medium">{rg.name}</span>
                                <span className="text-muted-foreground">{formatINR(rg.cost, 0)} ({rg.contribution}%)</span>
                              </div>
                              <Progress value={rg.contribution} className="h-1.5 [&>div]:bg-primary" />
                            </div>
                          ))}
                        </div>
                        <div className="pt-1 border-t border-border/20">
                          <p className="text-[10px] text-muted-foreground">
                            <span className="font-medium">Root cause hint:</span>{" "}
                            {a.direction === "spike"
                              ? `Unusual ${a.topService} usage detected — ${a.affectedGroups[0]?.name || "multiple groups"} contributed ${a.affectedGroups[0]?.contribution || 0}% of total spend.`
                              : `Reduced activity in ${a.topService} — possible scaling down or scheduled maintenance.`}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
