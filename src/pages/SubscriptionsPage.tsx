import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { CreditCard } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { SubscriptionCostChart } from "@/components/dashboard/SubscriptionCostChart";
import { ChartLoading, ErrorState } from "@/components/dashboard/LoadingState";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { useSubscriptionCost } from "@/hooks/useSubscriptionCost";
import { useFilteredRecords } from "@/hooks/useFilteredRecords";
import { formatINR } from "@/lib/currency";

const SubscriptionsPage = () => {
  const { filterParams } = useDashboardFilters();
  const { data: costBySub, isLoading, error, refetch } = useSubscriptionCost(filterParams);
  const { data: records } = useFilteredRecords(filterParams);

  const tableData = useMemo(() => {
    if (!costBySub || !records) return [];
    return costBySub.map((sub) => {
      const subRecords = records.filter((r) => r.subscriptionName === sub.subscription);
      const rgCount = new Set(subRecords.map((r) => r.resourceGroup)).size;
      return { ...sub, rgCount };
    });
  }, [costBySub, records]);

  if (isLoading) return <ChartLoading height="h-[400px]" />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-chart-4/15 flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-chart-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">Cost comparison across Azure subscriptions</p>
        </div>
      </div>

      <ChartCard delay={0.05}>
        <SubscriptionCostChart data={costBySub || []} />
      </ChartCard>

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subscription</TableHead>
              <TableHead className="text-right">Monthly Cost</TableHead>
              <TableHead className="text-right">Resource Groups</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row) => (
              <TableRow key={row.subscription}>
                <TableCell className="font-medium text-foreground">{row.subscription}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatINR(row.cost)}</TableCell>
                <TableCell className="text-right">{row.rgCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default memo(SubscriptionsPage);
