import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api";
import type { FilterParams } from "@/types/dashboardTypes";

export function useCostByService(filters: FilterParams) {
  return useQuery({
    queryKey: ["cost-by-service", filters],
    queryFn: () => dashboardApi.getCostByService(filters),
    staleTime: 60_000,
    retry: 2,
  });
}
