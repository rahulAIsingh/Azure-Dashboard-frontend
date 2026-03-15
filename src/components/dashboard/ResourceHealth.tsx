import { useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, CheckCircle2, AlertTriangle, XCircle, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { CostRecord } from "@/types/dashboardTypes";

interface ResourceHealthProps {
  records: CostRecord[];
}

type HealthStatus = "healthy" | "warning" | "critical";

interface ResourceHealth {
  name: string;
  type: string;
  resourceGroup: string;
  status: HealthStatus;
  score: number; // 0-100
  avgCost: number;
  costVariance: number;
  reason: string;
}

const statusConfig: Record<HealthStatus, { icon: typeof CheckCircle2; label: string; color: string; bgColor: string }> = {
  healthy: { icon: CheckCircle2, label: "Healthy", color: "text-kpi-up", bgColor: "bg-kpi-up/10" },
  warning: { icon: AlertTriangle, label: "Warning", color: "text-chart-4", bgColor: "bg-chart-4/10" },
  critical: { icon: XCircle, label: "Critical", color: "text-destructive", bgColor: "bg-destructive/10" },
};

export function ResourceHealth({ records }: ResourceHealthProps) {
  const healthData = useMemo(() => {
    const resourceMap = new Map<string, { costs: number[]; type: string; rg: string }>();

    records.forEach((r) => {
      if (!resourceMap.has(r.resourceName)) {
        resourceMap.set(r.resourceName, { costs: [], type: r.resourceType, rg: r.resourceGroup });
      }
      resourceMap.get(r.resourceName)!.costs.push(r.cost);
    });

    const results: ResourceHealth[] = [];

    resourceMap.forEach((data, name) => {
      const avg = data.costs.reduce((s, c) => s + c, 0) / data.costs.length;
      const maxCost = Math.max(...data.costs);
      const minCost = Math.min(...data.costs);
      const variance = avg > 0 ? ((maxCost - minCost) / avg) * 100 : 0;

      let status: HealthStatus = "healthy";
      let score = 95;
      let reason = "Stable cost pattern";

      if (variance > 50) {
        status = "critical";
        score = 30 + Math.floor(Math.random() * 20);
        reason = `High cost variance (${variance.toFixed(0)}%)`;
      } else if (variance > 30) {
        status = "warning";
        score = 60 + Math.floor(Math.random() * 15);
        reason = `Moderate cost fluctuation`;
      } else if (avg < 2) {
        status = "warning";
        score = 65;
        reason = "Potentially idle resource";
      } else {
        score = 85 + Math.floor(Math.random() * 15);
      }

      results.push({
        name,
        type: data.type.split("/").pop() || data.type,
        resourceGroup: data.rg,
        status,
        score,
        avgCost: Math.round(avg * 100) / 100,
        costVariance: Math.round(variance),
        reason,
      });
    });

    return results.sort((a, b) => a.score - b.score);
  }, [records]);

  const statusCounts = useMemo(() => {
    const counts = { healthy: 0, warning: 0, critical: 0 };
    healthData.forEach((r) => counts[r.status]++);
    return counts;
  }, [healthData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-elevated p-4 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground text-sm sm:text-base">Resource Health</h3>
      </div>

      {/* Summary badges */}
      <div className="flex gap-3 mb-5">
        {(["healthy", "warning", "critical"] as HealthStatus[]).map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          return (
            <div key={status} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${config.bgColor}`}>
              <Icon className={`h-3.5 w-3.5 ${config.color}`} />
              <span className={`text-xs font-semibold ${config.color}`}>{statusCounts[status]}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">{config.label}</span>
            </div>
          );
        })}
      </div>

      {/* Resource list */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {healthData.map((resource) => {
          const config = statusConfig[resource.status];
          const Icon = config.icon;
          return (
            <div key={resource.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <Icon className={`h-4 w-4 ${config.color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-medium text-foreground truncate">{resource.name}</span>
                  <Badge variant="outline" className="text-[9px] shrink-0 hidden sm:inline-flex">{resource.type}</Badge>
                </div>
                <span className="text-[10px] sm:text-xs text-muted-foreground">{resource.reason}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-16 hidden sm:block">
                  <Progress value={resource.score} className="h-1.5" />
                </div>
                <span className="text-xs font-semibold text-foreground w-8 text-right">{resource.score}</span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
