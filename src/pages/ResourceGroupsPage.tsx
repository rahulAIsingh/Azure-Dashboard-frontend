import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Layers, ArrowRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChartLoading, ErrorState } from "@/components/dashboard/LoadingState";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { useCostByResourceGroup } from "@/hooks/useCostByResourceGroup";
import { useFilteredRecords } from "@/hooks/useFilteredRecords";
import { formatINR } from "@/lib/currency";
import { format } from "date-fns";

const ResourceGroupsPage = () => {
  const { filterParams } = useDashboardFilters();
  const navigate = useNavigate();
  const { data: costByRG, isLoading, error, refetch } = useCostByResourceGroup(filterParams);
  const { data: records } = useFilteredRecords(filterParams);

  const tableData = useMemo(() => {
    if (!costByRG || !records) return [];
    return costByRG.map((rg) => {
      const rgRecords = records.filter((r) => r.resourceGroup === rg.resourceGroup);
      const resourceCount = new Set(rgRecords.map((r) => r.resourceName)).size;
      const lastDate = rgRecords.length > 0 ? rgRecords.reduce((latest, r) => r.usageDate > latest ? r.usageDate : latest, rgRecords[0].usageDate) : "—";
      return { ...rg, resourceCount, lastUpdated: lastDate !== "—" ? format(new Date(lastDate), "MMM dd, yyyy") : "—" };
    });
  }, [costByRG, records]);

  if (isLoading) return <ChartLoading height="h-[400px]" />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Layers className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Resource Groups</h1>
          <p className="text-sm text-muted-foreground">{tableData.length} resource groups tracked</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resource Group</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
              <TableHead className="text-right">Resources</TableHead>
              <TableHead className="text-right">Last Updated</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row) => (
              <TableRow key={row.resourceGroup} className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/resource-group/${row.resourceGroup}`)}>
                <TableCell className="font-medium text-foreground">{row.resourceGroup}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatINR(row.cost)}</TableCell>
                <TableCell className="text-right">{row.resourceCount}</TableCell>
                <TableCell className="text-right text-muted-foreground text-sm">{row.lastUpdated}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><ArrowRight className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default memo(ResourceGroupsPage);
