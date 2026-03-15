import { motion } from "framer-motion";
import { Lightbulb, AlertCircle, CheckCircle2 } from "lucide-react";
import type { CostRecord } from "@/types/dashboardTypes";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";

interface ResourceRecommendationsProps {
  records: CostRecord[];
}

interface Recommendation {
  id: string;
  resource: string;
  type: "idle" | "rightsize" | "reserved";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  savingsEstimate: number;
}

export function ResourceRecommendations({ records }: ResourceRecommendationsProps) {
  const recommendations = useMemo(() => {
    const resourceMap = new Map<string, { type: string; costs: number[]; service: string }>();
    records.forEach((r) => {
      const existing = resourceMap.get(r.resourceName);
      if (existing) {
        existing.costs.push(r.cost);
      } else {
        resourceMap.set(r.resourceName, { type: r.resourceType, costs: [r.cost], service: r.serviceName });
      }
    });

    const recs: Recommendation[] = [];
    let id = 0;

    resourceMap.forEach((data, name) => {
      const avg = data.costs.reduce((s, c) => s + c, 0) / data.costs.length;
      const max = Math.max(...data.costs);
      const min = Math.min(...data.costs);
      const variance = max - min;

      // Idle detection: very low and consistent cost (simulated)
      if (avg < 2 && data.type.includes("virtualMachines")) {
        recs.push({
          id: String(id++),
          resource: name,
          type: "idle",
          severity: "high",
          title: "Potentially Idle VM",
          description: `Average daily cost is $${avg.toFixed(2)}. Consider stopping or deallocating.`,
          savingsEstimate: Math.round(avg * 30 * 100) / 100,
        });
      }

      // Right-sizing: high variance suggests overprovisioning
      if (variance > avg * 0.6 && data.type.includes("virtualMachines") && avg > 5) {
        recs.push({
          id: String(id++),
          resource: name,
          type: "rightsize",
          severity: "medium",
          title: "Right-size Opportunity",
          description: `Usage varies $${min.toFixed(2)}–$${max.toFixed(2)}/day. Consider scaling to match demand.`,
          savingsEstimate: Math.round(avg * 0.25 * 30 * 100) / 100,
        });
      }

      // Reserved instance: consistent high cost
      if (avg > 10 && variance < avg * 0.3 && (data.service === "Compute" || data.service === "Database")) {
        recs.push({
          id: String(id++),
          resource: name,
          type: "reserved",
          severity: "low",
          title: "Reserved Instance Candidate",
          description: `Consistent spend of ~$${avg.toFixed(2)}/day. Reserved pricing could save ~30%.`,
          savingsEstimate: Math.round(avg * 0.3 * 30 * 100) / 100,
        });
      }
    });

    return recs.sort((a, b) => b.savingsEstimate - a.savingsEstimate).slice(0, 8);
  }, [records]);

  const totalSavings = recommendations.reduce((s, r) => s + r.savingsEstimate, 0);

  const severityColor = { high: "text-destructive", medium: "text-chart-4", low: "text-primary" };
  const severityBadge = {
    high: "bg-destructive/10 text-destructive border-destructive/20",
    medium: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    low: "bg-primary/10 text-primary border-primary/20",
  };
  const typeIcon = { idle: "🔴", rightsize: "📐", reserved: "💰" };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-chart-4" />
          <h3 className="text-sm font-semibold text-muted-foreground">Optimization Recommendations</h3>
        </div>
        {totalSavings > 0 && (
          <span className="text-xs font-semibold text-kpi-up">
            Est. savings: ${totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}/mo
          </span>
        )}
      </div>

      {recommendations.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">All resources are optimally configured</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {recommendations.map((r) => (
            <div key={r.id} className="flex items-start gap-3 p-3 rounded-md border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors">
              <span className="text-lg mt-0.5">{typeIcon[r.type]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-foreground">{r.title}</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${severityBadge[r.severity]}`}>
                    {r.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{r.resource}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-kpi-up">${r.savingsEstimate.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">/month</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
