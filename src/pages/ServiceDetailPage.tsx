import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EmptyState, ErrorState, ChartLoading } from "@/components/dashboard/LoadingState";
import { ServiceDrilldown } from "@/components/dashboard/ServiceDrilldown";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { useFilteredRecords } from "@/hooks/useFilteredRecords";

export default function ServiceDetailPage() {
  const { service } = useParams<{ service: string }>();
  const navigate = useNavigate();
  const { filterParams } = useDashboardFilters();

  const serviceName = service ? decodeURIComponent(service) : null;
  const effectiveFilters = useMemo(
    () => (serviceName ? { ...filterParams, service: serviceName } : filterParams),
    [filterParams, serviceName]
  );

  const { data: records, isLoading, error, refetch } = useFilteredRecords(
    serviceName ? effectiveFilters : {}
  );

  if (!serviceName) {
    navigate("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <ChartLoading height="h-[600px]" />
        <p className="mt-2 text-center text-sm text-muted-foreground">Loading {serviceName} details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState message={`Failed to load ${serviceName} details`} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          message={`No data for ${serviceName}`}
          description="No cost records were found for this service. Try a different date range or filter combination."
        />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <ServiceDrilldown service={serviceName} records={records} onBack={() => navigate(-1)} />
    </div>
  );
}
