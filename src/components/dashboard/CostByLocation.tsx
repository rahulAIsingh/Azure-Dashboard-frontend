import { motion } from "framer-motion";
import { useMemo } from "react";
import type { CostRecord } from "@/types/dashboardTypes";
import { MapPin } from "lucide-react";
import { formatINR } from "@/lib/currency";

interface CostByLocationProps {
  records: CostRecord[];
}

export function CostByLocation({ records }: CostByLocationProps) {
  const data = useMemo(() => {
    const map = new Map<string, { cost: number; resources: number }>();
    const resourceSet = new Map<string, Set<string>>();
    records.forEach((r) => {
      map.set(r.location, { cost: (map.get(r.location)?.cost || 0) + r.cost, resources: 0 });
      if (!resourceSet.has(r.location)) resourceSet.set(r.location, new Set());
      resourceSet.get(r.location)!.add(r.resourceName);
    });
    return Array.from(map.entries())
      .map(([location, v]) => ({ location, cost: Math.round(v.cost * 100) / 100, resources: resourceSet.get(location)?.size || 0 }))
      .sort((a, b) => b.cost - a.cost);
  }, [records]);

  const maxCost = data.length > 0 ? data[0].cost : 1;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-muted-foreground">Cost by Region</h3>
      </div>
      <div className="space-y-3">
        {data.map((d) => {
          const pct = (d.cost / maxCost) * 100;
          return (
            <div key={d.location}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{d.location}</span>
                <span className="text-sm font-bold text-foreground">{formatINR(d.cost)}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{d.resources} resources</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
