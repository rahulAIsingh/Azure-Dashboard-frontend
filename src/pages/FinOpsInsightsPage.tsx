import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Lightbulb, TrendingUp, AlertTriangle, Server } from "lucide-react";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { CostForecastCard } from "@/components/dashboard/CostForecastCard";
import { CostIncreasePanel } from "@/components/dashboard/CostIncreasePanel";
import { ResourceRecommendations } from "@/components/dashboard/ResourceRecommendations";
import { CostAnomalies } from "@/components/dashboard/CostAnomalies";
import { ChartLoading } from "@/components/dashboard/LoadingState";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { useDailyCost } from "@/hooks/useDailyCost";
import { useFilteredRecords } from "@/hooks/useFilteredRecords";

const FinOpsInsightsPage = () => {
  const filters = useDashboardFilters();
  const { filterParams, allTimeFilterParams } = filters;
  const { data: summary } = useDashboardSummary(filterParams);
  const { data: dailyCostAll } = useDailyCost(allTimeFilterParams);
  const { data: filteredRecords, isLoading } = useFilteredRecords(filterParams);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-chart-3/15 flex items-center justify-center">
          <Lightbulb className="h-5 w-5 text-chart-3" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">FinOps Insights</h1>
          <p className="text-sm text-muted-foreground">Cost optimization recommendations and forecasts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ChartCard delay={0.05}>
          {summary && dailyCostAll ? (
            <CostForecastCard averageDailyCost={summary.averageDailyCost} totalCostThisMonth={summary.totalCostThisMonth} />
          ) : <ChartLoading />}
        </ChartCard>
        <ChartCard delay={0.1}>
          {filteredRecords ? <CostIncreasePanel records={filteredRecords} /> : <ChartLoading />}
        </ChartCard>
      </div>

      {isLoading ? <ChartLoading height="h-[300px]" /> : filteredRecords && (
        <>
          <ChartCard delay={0.15}><CostAnomalies records={filteredRecords} /></ChartCard>
          <ChartCard delay={0.2}><ResourceRecommendations records={filteredRecords} /></ChartCard>
        </>
      )}
    </motion.div>
  );
};

export default memo(FinOpsInsightsPage);
