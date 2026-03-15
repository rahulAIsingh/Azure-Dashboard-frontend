import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api";
import type { FilterParams } from "@/types/dashboardTypes";

export function useDailyCost(filters: FilterParams) {
  return useQuery({
    queryKey: ["daily-cost", filters],
    queryFn: () => dashboardApi.getDailyCost(filters),
    staleTime: 60_000,
    retry: 2,
  });
}
