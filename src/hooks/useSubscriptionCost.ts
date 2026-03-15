import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api";
import type { FilterParams } from "@/types/dashboardTypes";

export function useSubscriptionCost(filters: FilterParams) {
  return useQuery({
    queryKey: ["subscription-cost", filters],
    queryFn: () => dashboardApi.getSubscriptionCost(filters),
    staleTime: 60_000,
    retry: 2,
  });
}
