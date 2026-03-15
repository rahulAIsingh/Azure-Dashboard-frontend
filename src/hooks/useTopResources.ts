import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api";
import type { FilterParams } from "@/types/dashboardTypes";

export function useTopResources(filters: FilterParams, limit = 10) {
  return useQuery({
    queryKey: ["top-resources", filters, limit],
    queryFn: () => dashboardApi.getTopResources(filters, limit),
    staleTime: 60_000,
    retry: 2,
  });
}
