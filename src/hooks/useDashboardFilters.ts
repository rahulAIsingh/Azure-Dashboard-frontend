import { useFilterContext } from "@/contexts/FilterContext";

export { getDateRangeValues } from "@/contexts/FilterContext";

export function useDashboardFilters() {
  return useFilterContext();
}

