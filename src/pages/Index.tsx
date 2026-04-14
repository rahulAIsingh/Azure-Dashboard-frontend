import { useState, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitCompareArrows, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { CostByResourceGroupChart } from "@/components/dashboard/CostByResourceGroupChart";
import { CostByServiceChart } from "@/components/dashboard/CostByServiceChart";
import { DailyCostChart } from "@/components/dashboard/DailyCostChart";
import { TopResourcesChart } from "@/components/dashboard/TopResourcesChart";
import { SubscriptionCostChart } from "@/components/dashboard/SubscriptionCostChart";
import { ResourceGroupDrilldown } from "@/components/dashboard/ResourceGroupDrilldown";
import { ServiceDrilldown } from "@/components/dashboard/ServiceDrilldown";
import { BudgetAlerts, type BudgetAlert } from "@/components/dashboard/BudgetAlerts";
import { CostAnomalies } from "@/components/dashboard/CostAnomalies";
import { CostForecastChart } from "@/components/dashboard/CostForecastChart";
import { ResourceRecommendations } from "@/components/dashboard/ResourceRecommendations";
import { MonthOverMonthChart } from "@/components/dashboard/MonthOverMonthChart";
import { CostByLocation } from "@/components/dashboard/CostByLocation";
import { ResourceGroupCompare } from "@/components/dashboard/ResourceGroupCompare";
import { Favorites } from "@/components/dashboard/Favorites";
import { CostHeatmap } from "@/components/dashboard/CostHeatmap";
import { ResourceHealth } from "@/components/dashboard/ResourceHealth";
import { SavingsTracker } from "@/components/dashboard/SavingsTracker";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { CostTreemap } from "@/components/dashboard/CostTreemap";
import { UserManagement } from "@/components/dashboard/UserManagement";
import { exportToCsv } from "@/lib/csvExport";
import { exportToExcel } from "@/lib/excelExport";
import { KpiLoading, ChartLoading, ErrorState, EmptyState } from "@/components/dashboard/LoadingState";
import { useAuth } from "@/contexts/AuthContext";

import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { useCostByResourceGroup } from "@/hooks/useCostByResourceGroup";
import { useCostByService } from "@/hooks/useCostByService";
import { useDailyCost } from "@/hooks/useDailyCost";
import { useTopResources } from "@/hooks/useTopResources";
import { useSubscriptionCost } from "@/hooks/useSubscriptionCost";
import { useFilteredRecords } from "@/hooks/useFilteredRecords";
import type { CostRecord, DailyCost, ResourceGroupCost, ServiceCost, SubscriptionCost, TopResource } from "@/types/dashboardTypes";

const sectionTabs = [
  { id: "overview", label: "Overview" },
  { id: "analytics", label: "Analytics" },
  { id: "forecast", label: "Forecast" },
  { id: "alerts", label: "Alerts" },
  { id: "optimize", label: "Optimize" },
  { id: "users", label: "Users" },
];

type OverviewSectionProps = {
  costByRG?: ResourceGroupCost[];
  costByService?: ServiceCost[];
  dailyCost?: DailyCost[];
  topResources?: TopResource[];
  costBySub?: SubscriptionCost[];
  filteredRecords?: CostRecord[];
  allTimeRecords?: CostRecord[];
  isLoadingRG: boolean;
  isLoadingService: boolean;
  isLoadingDaily: boolean;
  isLoadingTop: boolean;
  isLoadingSub: boolean;
  isLoadingRecords: boolean;
  errorRG: Error | null;
  errorService: Error | null;
  errorDaily: Error | null;
  onSelectGroup: (resourceGroup: string) => void;
  onCompare: () => void;
  refetchRG: () => unknown;
  refetchService: () => unknown;
  refetchDaily: () => unknown;
  onSelectSubscription: (subscription: string) => void;
  onSelectService: (service: string) => void;
};

const OverviewSection = memo(function OverviewSection({
  costByRG, costByService, dailyCost, topResources, costBySub, filteredRecords, allTimeRecords,
  isLoadingRG, isLoadingService, isLoadingDaily, isLoadingTop, isLoadingSub, isLoadingRecords,
  errorRG, errorService, errorDaily,
  onSelectGroup, onCompare, refetchRG, refetchService, refetchDaily, onSelectSubscription, onSelectService
}: OverviewSectionProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" className="gap-2 font-medium text-xs sm:text-sm" onClick={onCompare}>
          <GitCompareArrows className="h-4 w-4" /><span>Compare Groups</span>
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ChartCard delay={0.05}>
          {isLoadingRG ? <ChartLoading /> : errorRG ? <ErrorState onRetry={refetchRG} /> : costByRG?.length === 0 ? <EmptyState /> :
            <CostByResourceGroupChart data={costByRG || []} onSelectGroup={onSelectGroup} />}
        </ChartCard>
        <ChartCard delay={0.1}>
          {isLoadingService ? <ChartLoading /> : errorService ? <ErrorState onRetry={refetchService} /> : costByService?.length === 0 ? <EmptyState /> :
            <CostByServiceChart data={costByService || []} onSelectService={onSelectService} />}
        </ChartCard>
      </div>
      <ChartCard delay={0.15}>
        {isLoadingDaily ? <ChartLoading height="h-[350px]" /> : errorDaily ? <ErrorState onRetry={refetchDaily} /> : dailyCost?.length === 0 ? <EmptyState /> :
          <DailyCostChart data={dailyCost || []} />}
      </ChartCard>
      {!isLoadingRecords && filteredRecords && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <ChartCard delay={0.2}><CostHeatmap records={filteredRecords} /></ChartCard>
          <ChartCard delay={0.25}><ActivityTimeline records={filteredRecords} /></ChartCard>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ChartCard delay={0.3}>{isLoadingTop ? <ChartLoading /> : <TopResourcesChart data={topResources || []} />}</ChartCard>
        <ChartCard delay={0.35}>{isLoadingSub ? <ChartLoading /> : <SubscriptionCostChart data={costBySub || []} onSelectSubscription={onSelectSubscription} />}</ChartCard>
      </div>
      {!isLoadingRecords && filteredRecords && (
        <ChartCard delay={0.4}><CostTreemap records={filteredRecords} onDrillToGroup={onSelectGroup} /></ChartCard>
      )}
    </div>
  );
});

const Index = () => {
  const navigate = useNavigate();
  const filters = useDashboardFilters();
  const { filterParams, allTimeFilterParams } = filters;

  const [drilldownRG, setDrilldownRG] = useState<string | null>(null);
  const [drilldownService, setDrilldownService] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  const [budgets, setBudgets] = useState<BudgetAlert[]>([]);

  const { currentUser, users, addUser, removeUser, updateUser } = useAuth();

  const { data: summary, isLoading: isLoadingSummary, error: errorSummary, refetch: refetchSummary } = useDashboardSummary(filterParams);
  const { data: costByRG, isLoading: isLoadingRG, error: errorRG, refetch: refetchRG } = useCostByResourceGroup(filterParams);
  const { data: costByService, isLoading: isLoadingService, error: errorService, refetch: refetchService } = useCostByService(filterParams);
  const { data: dailyCost, isLoading: isLoadingDaily, error: errorDaily, refetch: refetchDaily } = useDailyCost(filterParams);
  const { data: topResources, isLoading: isLoadingTop } = useTopResources(filterParams);
  const { data: costBySub, isLoading: isLoadingSub } = useSubscriptionCost(filterParams);
  const { data: filteredRecords, isLoading: isLoadingRecords } = useFilteredRecords(filterParams);
  const { data: allTimeRecords } = useFilteredRecords(allTimeFilterParams);
  const { data: dailyCostAll } = useDailyCost(allTimeFilterParams);

  const getCostForScope = useCallback((scope: string, value: string) => {
    if (!filteredRecords) return 0;
    return filteredRecords
      .filter((r) => scope === "subscription" ? r.subscriptionName === value : r.resourceGroup === value)
      .reduce((s, r) => s + r.cost, 0);
  }, [filteredRecords]);

  const handleAddBudget = useCallback((b: BudgetAlert) => setBudgets((prev) => [...prev, b]), []);
  const handleRemoveBudget = useCallback((id: string) => setBudgets((prev) => prev.filter((b) => b.id !== id)), []);
  const handleExport = useCallback(() => { if (filteredRecords) exportToCsv(filteredRecords); }, [filteredRecords]);

  const handleFavoriteSelect = useCallback((fav: { type: string; name: string; resourceGroup?: string }) => {
    if (fav.type === "resourceGroup" || fav.resourceGroup) setDrilldownRG(fav.resourceGroup || fav.name);
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <OverviewSection
            costByRG={costByRG} costByService={costByService} dailyCost={dailyCost}
            topResources={topResources} costBySub={costBySub} filteredRecords={filteredRecords} allTimeRecords={allTimeRecords}
            isLoadingRG={isLoadingRG} isLoadingService={isLoadingService} isLoadingDaily={isLoadingDaily}
            isLoadingTop={isLoadingTop} isLoadingSub={isLoadingSub} isLoadingRecords={isLoadingRecords}
            errorRG={errorRG} errorService={errorService} errorDaily={errorDaily}
            onSelectGroup={setDrilldownRG} onCompare={() => setCompareMode(true)}
            refetchRG={refetchRG} refetchService={refetchService} refetchDaily={refetchDaily}
            onSelectSubscription={filters.setSubscription}
            onSelectService={(service) => navigate(`/service/${encodeURIComponent(service)}`)}
          />
        );
      case "analytics":
        return (
          <div className="space-y-4 sm:space-y-6">
            {allTimeRecords && <ChartCard delay={0.05}><MonthOverMonthChart records={allTimeRecords} /></ChartCard>}
            {filteredRecords && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <ChartCard delay={0.1}><CostHeatmap records={filteredRecords} /></ChartCard>
                  <ChartCard delay={0.15}><CostTreemap records={filteredRecords} onDrillToGroup={setDrilldownRG} /></ChartCard>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <ChartCard delay={0.2}><CostByLocation records={filteredRecords} /></ChartCard>
                  <div className="space-y-4 sm:space-y-6">
                    {costByService && (
                      <ChartCard delay={0.25}>
                        <CostByServiceChart
                          data={costByService}
                          onSelectService={(service) => navigate(`/service/${encodeURIComponent(service)}`)}
                        />
                      </ChartCard>
                    )}
                    {costBySub && <ChartCard delay={0.3}><SubscriptionCostChart data={costBySub} onSelectSubscription={filters.setSubscription} /></ChartCard>}
                  </div>
                </div>
              </>
            )}
            {isLoadingRecords && <ChartLoading height="h-[400px]" />}
          </div>
        );
      case "forecast":
        return (
          <div className="space-y-4 sm:space-y-6">
            {dailyCostAll ? <ChartCard delay={0.05}><CostForecastChart dailyData={dailyCostAll} /></ChartCard> : <ChartLoading height="h-[350px]" />}
            {isLoadingDaily ? <ChartLoading /> : dailyCost && <ChartCard delay={0.1}><DailyCostChart data={dailyCost} /></ChartCard>}
            {filteredRecords && <ChartCard delay={0.15}><SavingsTracker records={filteredRecords} /></ChartCard>}
          </div>
        );
      case "alerts":
        return (
          <div className="space-y-4 sm:space-y-6">
            {filteredRecords ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <ChartCard delay={0.05}>
                    <BudgetAlerts budgets={budgets} onAddBudget={handleAddBudget} onRemoveBudget={handleRemoveBudget}
                      getCostForScope={getCostForScope} records={filteredRecords} />
                  </ChartCard>
                  <ChartCard delay={0.1}><CostAnomalies records={filteredRecords} /></ChartCard>
                </div>
                <ChartCard delay={0.15}><ActivityTimeline records={filteredRecords} /></ChartCard>
              </>
            ) : <ChartLoading height="h-[400px]" />}
          </div>
        );
      case "optimize":
        return (
          <div className="space-y-4 sm:space-y-6">
            {filteredRecords ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <ChartCard delay={0.05}><SavingsTracker records={filteredRecords} /></ChartCard>
                  <ChartCard delay={0.1}><ResourceHealth records={filteredRecords} /></ChartCard>
                </div>
                <ChartCard delay={0.15}><ResourceRecommendations records={filteredRecords} /></ChartCard>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {topResources && <ChartCard delay={0.2}><TopResourcesChart data={topResources} /></ChartCard>}
                  <ChartCard delay={0.25}><CostByLocation records={filteredRecords} /></ChartCard>
                </div>
              </>
            ) : <ChartLoading height="h-[400px]" />}
          </div>
        );
      case "users":
        return (
          <UserManagement
            users={users}
            currentUser={currentUser}
            onAddUser={addUser}
            onRemoveUser={removeUser}
            onUpdateUser={updateUser}
          />
        );
      default: return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {compareMode ? (
        <motion.div key="compare" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
          {isLoadingRecords ? <ChartLoading height="h-[500px]" /> :
            filteredRecords ? <ResourceGroupCompare records={filteredRecords} onBack={() => setCompareMode(false)} /> :
              <EmptyState message="No records found" description="Unable to load cost records for comparison." />}
        </motion.div>
      ) : drilldownRG ? (
        <motion.div key="drilldown" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
          {isLoadingRecords ? <ChartLoading height="h-[500px]" /> :
            filteredRecords ? <ResourceGroupDrilldown resourceGroup={drilldownRG} records={filteredRecords} allRecords={allTimeRecords} onBack={() => setDrilldownRG(null)} /> :
              <EmptyState message="No records found" description="Unable to load cost records for drilldown." />}
        </motion.div>
      ) : drilldownService ? (
        <motion.div key="drilldown-service" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
          {isLoadingRecords ? <ChartLoading height="h-[500px]" /> :
            filteredRecords ? <ServiceDrilldown service={drilldownService} records={filteredRecords} allRecords={allTimeRecords} onBack={() => setDrilldownService(null)} /> :
              <EmptyState message="No records found" description="Unable to load cost records for drilldown." />}
        </motion.div>
      ) : (
        <motion.div key={activeSection} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4 sm:space-y-6">
          {summary && (
            <WelcomeBanner
              userName={currentUser?.name?.split(" ")[0] || "User"}
              totalCostThisMonth={summary.totalCostThisMonth}
              onNavigate={(section) => { setActiveSection(section); setDrilldownRG(null); setDrilldownService(null); setCompareMode(false); }}
              onExport={handleExport}
            />
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <Tabs value={activeSection} onValueChange={(v) => { setActiveSection(v); setDrilldownRG(null); setDrilldownService(null); setCompareMode(false); }}>
              <TabsList>
                {sectionTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="text-xs sm:text-sm">{tab.label}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="flex-1" />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1" />CSV</Button>
              <Button variant="outline" size="sm" onClick={() => { if (filteredRecords) { import("@/lib/excelExport").then((m) => m.exportToExcel(filteredRecords)); } }}>
                <Download className="h-4 w-4 mr-1" />Excel
              </Button>
            </div>
          </div>

          <Favorites onSelectFavorite={handleFavoriteSelect} />
          {isLoadingSummary ? <KpiLoading /> : errorSummary ? <ErrorState message="Failed to load summary" onRetry={() => refetchSummary()} /> :
            summary && <KpiCards {...summary} />}
          {renderSection()}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Index;
