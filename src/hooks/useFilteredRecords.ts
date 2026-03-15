import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api";
import type { FilterParams } from "@/types/dashboardTypes";

export function useFilteredRecords(filters: FilterParams) {
  return useQuery({
    queryKey: ["filtered-records", filters],
    queryFn: () => dashboardApi.getFilteredRecords(filters),
    staleTime: 30_000,
    retry: 2,
  });
}
