import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api";
import type { FilterParams } from "@/types/dashboardTypes";

export function useDashboardSummary(filters: FilterParams) {
  return useQuery({
    queryKey: ["dashboard-summary", filters],
    queryFn: () => dashboardApi.getSummary(filters),
    staleTime: 60_000,
    retry: 2,
  });
}
