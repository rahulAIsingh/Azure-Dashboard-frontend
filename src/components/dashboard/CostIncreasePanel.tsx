import { useMemo } from "react";
import { TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/currency";
import type { CostRecord } from "@/types/dashboardTypes";
import { subDays, format } from "date-fns";

interface CostIncreasePanelProps {
  records: CostRecord[];
}

export function CostIncreasePanel({ records }: CostIncreasePanelProps) {
  const data = useMemo(() => {
    const now = new Date();
    const mid = format(subDays(now, 15), "yyyy-MM-dd");
    const start = format(subDays(now, 30), "yyyy-MM-dd");
    const end = format(now, "yyyy-MM-dd");

    const previous = records.filter((r) => r.usageDate >= start && r.usageDate < mid);
    const current = records.filter((r) => r.usageDate >= mid && r.usageDate <= end);

    const prevByResource = new Map<string, number>();
    previous.forEach((r) => prevByResource.set(r.resourceName, (prevByResource.get(r.resourceName) || 0) + r.cost));
    const currByResource = new Map<string, number>();
    current.forEach((r) => currByResource.set(r.resourceName, (currByResource.get(r.resourceName) || 0) + r.cost));

    const allResources = new Set([...prevByResource.keys(), ...currByResource.keys()]);
    const changes = Array.from(allResources).map((name) => {
      const prev = prevByResource.get(name) || 0;
      const curr = currByResource.get(name) || 0;
      const change = prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0;
      return { resource: name, previousCost: prev, currentCost: curr, changePercent: change };
    });

    return changes.sort((a, b) => b.changePercent - a.changePercent).slice(0, 8);
  }, [records]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-chart-5" />
        <h3 className="font-semibold text-foreground">Cost Growth Detector</h3>
      </div>
      <div className="overflow-auto max-h-[300px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resource</TableHead>
              <TableHead className="text-right">Previous</TableHead>
              <TableHead className="text-right">Current</TableHead>
              <TableHead className="text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.resource}>
                <TableCell className="font-medium text-foreground text-xs truncate max-w-[150px]">{row.resource}</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatINR(row.previousCost)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatINR(row.currentCost)}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className={row.changePercent > 0 ? "text-destructive border-destructive/30" : "text-accent border-accent/30"}>
                    {row.changePercent > 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                    {Math.abs(row.changePercent).toFixed(1)}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
