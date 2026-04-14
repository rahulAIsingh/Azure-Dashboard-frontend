import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ResourceGroupDrilldown } from "@/components/dashboard/ResourceGroupDrilldown";
import { ChartLoading, ErrorState, EmptyState } from "@/components/dashboard/LoadingState";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { useFilteredRecords } from "@/hooks/useFilteredRecords";
import { getDateRangeValues } from "@/contexts/FilterContext";

export default function ResourceGroupDetailPage() {
  const { resourceGroup } = useParams<{ resourceGroup: string }>();
  const navigate = useNavigate();
  const { filterParams } = useDashboardFilters();

  const rgName = resourceGroup ? decodeURIComponent(resourceGroup) : null;
  const effectiveFilters = useMemo(() => (
    rgName ? { ...filterParams, resourceGroup: rgName } : filterParams
  ), [filterParams, rgName]);

  const { data: records, isLoading, error, refetch } = useFilteredRecords(
    rgName ? effectiveFilters : {}
  );

  const allTimeFilterParams = useMemo(() => {
    const [startDate, endDate] = getDateRangeValues("365");
    return {
      subscription: filterParams.subscription !== "All" ? filterParams.subscription : undefined,
      resourceGroup: rgName || undefined,
      startDate,
      endDate,
    };
  }, [filterParams.subscription, rgName]);

  const { data: allTimeRecords } = useFilteredRecords(allTimeFilterParams);

  if (!rgName) {
    navigate("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <ChartLoading height="h-[600px]" />
        <p className="text-sm text-muted-foreground text-center mt-2">Loading {rgName} data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState message={`Failed to load data for ${rgName}`} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          message={`No data for ${rgName}`}
          description="No cost records were found for this resource group. Try a different date range or check back later."
        />
        <div className="flex justify-center mt-4">
          <button onClick={() => navigate("/")} className="text-sm text-primary hover:underline">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <ResourceGroupDrilldown
        resourceGroup={rgName}
        records={records}
        allRecords={allTimeRecords}
        onBack={() => navigate("/")}
      />
    </div>
  );
}
