import { memo, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { CostByResourceGroupChart } from "@/components/dashboard/CostByResourceGroupChart";
import { CostByServiceChart } from "@/components/dashboard/CostByServiceChart";
import { DailyCostChart } from "@/components/dashboard/DailyCostChart";
import { TopResourcesChart } from "@/components/dashboard/TopResourcesChart";
import { CostByLocation } from "@/components/dashboard/CostByLocation";
import { CostTreemap } from "@/components/dashboard/CostTreemap";
import { ChartLoading, ErrorState, EmptyState } from "@/components/dashboard/LoadingState";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { useCostByResourceGroup } from "@/hooks/useCostByResourceGroup";
import { useCostByService } from "@/hooks/useCostByService";
import { useDailyCost } from "@/hooks/useDailyCost";
import { useTopResources } from "@/hooks/useTopResources";
import { useFilteredRecords } from "@/hooks/useFilteredRecords";
import { exportToCsv } from "@/lib/csvExport";
import { exportToExcel } from "@/lib/excelExport";
import { useNavigate } from "react-router-dom";

const CostExplorerPage = () => {
  const filters = useDashboardFilters();
  const { filterParams } = filters;
  const navigate = useNavigate();

  const { data: costByRG, isLoading: isLoadingRG, error: errorRG, refetch: refetchRG } = useCostByResourceGroup(filterParams);
  const { data: costByService, isLoading: isLoadingService, error: errorService, refetch: refetchService } = useCostByService(filterParams);
  const { data: dailyCost, isLoading: isLoadingDaily, error: errorDaily, refetch: refetchDaily } = useDailyCost(filterParams);
  const { data: topResources, isLoading: isLoadingTop } = useTopResources(filterParams);
  const { data: filteredRecords, isLoading: isLoadingRecords } = useFilteredRecords(filterParams);

  const handleExportCsv = useCallback(() => { if (filteredRecords) exportToCsv(filteredRecords); }, [filteredRecords]);
  const handleExportExcel = useCallback(() => { if (filteredRecords) exportToExcel(filteredRecords); }, [filteredRecords]);
  const handleSelectGroup = useCallback((rg: string) => navigate(`/resource-group/${rg}`), [navigate]);
  const handleSelectService = useCallback((service: string) => navigate(`/service/${encodeURIComponent(service)}`), [navigate]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Cost Explorer</h1>
          <p className="text-sm text-muted-foreground">Analyze your Azure spending across all dimensions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv}><Download className="h-4 w-4 mr-1" />CSV</Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}><Download className="h-4 w-4 mr-1" />Excel</Button>
        </div>
      </div>

      <ChartCard delay={0.05}>
        {isLoadingDaily ? <ChartLoading height="h-[350px]" /> : errorDaily ? <ErrorState onRetry={refetchDaily} /> : dailyCost?.length === 0 ? <EmptyState /> :
          <DailyCostChart data={dailyCost || []} />}
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ChartCard delay={0.1}>
          {isLoadingService ? <ChartLoading /> : errorService ? <ErrorState onRetry={refetchService} /> : costByService?.length === 0 ? <EmptyState /> :
            <CostByServiceChart data={costByService || []} onSelectService={handleSelectService} />}
        </ChartCard>
        <ChartCard delay={0.15}>
          {isLoadingRG ? <ChartLoading /> : errorRG ? <ErrorState onRetry={refetchRG} /> : costByRG?.length === 0 ? <EmptyState /> :
            <CostByResourceGroupChart data={costByRG || []} onSelectGroup={handleSelectGroup} />}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ChartCard delay={0.2}>
          {isLoadingTop ? <ChartLoading /> : <TopResourcesChart data={topResources || []} />}
        </ChartCard>
        {!isLoadingRecords && filteredRecords && (
          <ChartCard delay={0.25}><CostByLocation records={filteredRecords} /></ChartCard>
        )}
      </div>

      {!isLoadingRecords && filteredRecords && (
        <ChartCard delay={0.3}><CostTreemap records={filteredRecords} onDrillToGroup={handleSelectGroup} /></ChartCard>
      )}
    </motion.div>
  );
};

export default memo(CostExplorerPage);
