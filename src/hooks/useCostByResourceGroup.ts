import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api";
import type { FilterParams } from "@/types/dashboardTypes";

export function useCostByResourceGroup(filters: FilterParams) {
  return useQuery({
    queryKey: ["cost-by-resource-group", filters],
    queryFn: () => dashboardApi.getCostByResourceGroup(filters),
    staleTime: 60_000,
    retry: 2,
  });
}
