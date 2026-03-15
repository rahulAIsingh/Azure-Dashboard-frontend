import React, { createContext, useContext, useMemo, useCallback, useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { subDays, format } from "date-fns";
import type { FilterParams } from "@/types/dashboardTypes";

const FILTER_STORAGE_KEY = "azure-dashboard-filters";
export const JANUARY_2026_PRICING_RANGE_VALUE = "jan-2026";
export const JANUARY_2026_PRICING_RANGE: [string, string] = ["2026-01-01", "2026-01-31"];

export function getDateRangeValues(range: string, customRange?: [Date, Date] | null): [string, string] {
  if (range === JANUARY_2026_PRICING_RANGE_VALUE) {
    return JANUARY_2026_PRICING_RANGE;
  }
  if (range === "custom" && customRange) {
    return [format(customRange[0], "yyyy-MM-dd"), format(customRange[1], "yyyy-MM-dd")];
  }
  const days = Number.isNaN(Number.parseInt(range, 10)) ? 30 : Number.parseInt(range, 10);
  const end = format(new Date(), "yyyy-MM-dd");
  const start = format(subDays(new Date(), days), "yyyy-MM-dd");
  return [start, end];
}

type StoredFilters = {
  subscription?: string;
  resourceGroup?: string;
  service?: string;
  location?: string;
  dateRange?: string;
  customDateRange?: [string, string] | null;
};

function parseDateRange(start?: string | null, end?: string | null): [Date, Date] | null {
  if (!start || !end) return null;
  const parseYMD = (s: string) => {
    const parts = s.split("-").map((v) => Number.parseInt(v, 10));
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };
  const from = parseYMD(start);
  const to = parseYMD(end);
  if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  return [from, to];
}

function readStoredFilters(): StoredFilters | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FILTER_STORAGE_KEY);
    return raw ? JSON.parse(raw) as StoredFilters : null;
  } catch {
    return null;
  }
}

interface FilterContextType {
  subscription: string;
  resourceGroup: string;
  service: string;
  location: string;
  dateRange: string;
  customDateRange: [Date, Date] | null;
  setSubscription: (v: string) => void;
  setResourceGroup: (v: string) => void;
  setService: (v: string) => void;
  setLocation: (v: string) => void;
  setDateRange: (v: string) => void;
  setCustomDateRange: (v: [Date, Date] | null) => void;
  filterParams: FilterParams;
  allTimeFilterParams: FilterParams;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isReady, setIsReady] = useState(false);

  // 1. Internal state initialized from URL or Storage
  const [filters, setFilters] = useState<Required<Omit<StoredFilters, "customDateRange">> & { customDateRange: [Date, Date] | null }>(() => {
    const stored = readStoredFilters();
    const urlSub = searchParams.get("subscription");
    const urlRG = searchParams.get("resourceGroup");
    const urlService = searchParams.get("service");
    const urlLoc = searchParams.get("location");
    const urlRange = searchParams.get("range");
    const urlCustomRange = parseDateRange(searchParams.get("startDate"), searchParams.get("endDate"));

    return {
      subscription: urlSub || stored?.subscription || "All",
      resourceGroup: urlRG || stored?.resourceGroup || "All",
      service: urlService || stored?.service || "All",
      location: urlLoc || stored?.location || "All",
      dateRange: urlRange || stored?.dateRange || "30",
      customDateRange: urlCustomRange || (stored?.customDateRange ? parseDateRange(stored.customDateRange[0], stored.customDateRange[1]) : null),
    };
  });

  // 2. Sync URL -> State (When navigating with params)
  useEffect(() => {
    const urlSub = searchParams.get("subscription");
    const urlRG = searchParams.get("resourceGroup");
    const urlService = searchParams.get("service");
    const urlLoc = searchParams.get("location");
    const urlRange = searchParams.get("range");
    const urlCustomRange = parseDateRange(searchParams.get("startDate"), searchParams.get("endDate"));

    if (urlSub || urlRange || urlCustomRange) {
      setFilters(prev => ({
        ...prev,
        subscription: urlSub || prev.subscription,
        resourceGroup: urlRG || prev.resourceGroup,
        service: urlService || prev.service,
        location: urlLoc || prev.location,
        dateRange: urlRange || prev.dateRange,
        customDateRange: urlCustomRange || prev.customDateRange,
      }));
    }
    setIsReady(true);
  }, [searchParams]);

  // 3. Sync State -> URL (When navigating without params)
  useEffect(() => {
    if (!isReady) return;

    const hasUrlParams = searchParams.get("subscription") || searchParams.get("range") || searchParams.get("startDate");
    
    if (!hasUrlParams) {
      const next = new URLSearchParams(searchParams);
      let changed = false;

      if (filters.subscription !== "All") { next.set("subscription", filters.subscription); changed = true; }
      if (filters.resourceGroup !== "All") { next.set("resourceGroup", filters.resourceGroup); changed = true; }
      if (filters.service !== "All") { next.set("service", filters.service); changed = true; }
      if (filters.location !== "All") { next.set("location", filters.location); changed = true; }
      if (filters.dateRange !== "30") { next.set("range", filters.dateRange); changed = true; }
      if (filters.customDateRange) {
        next.set("range", "custom");
        next.set("startDate", format(filters.customDateRange[0], "yyyy-MM-dd"));
        next.set("endDate", format(filters.customDateRange[1], "yyyy-MM-dd"));
        changed = true;
      }

      if (changed) {
        setSearchParams(next, { replace: true });
      }
    }
  }, [isReady, filters, searchParams, setSearchParams]);

  // 4. Persistence to localStorage
  useEffect(() => {
    if (!isReady) return;
    const toStore: StoredFilters = {
      ...filters,
      customDateRange: filters.customDateRange ? [format(filters.customDateRange[0], "yyyy-MM-dd"), format(filters.customDateRange[1], "yyyy-MM-dd")] : null
    };
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(toStore));
  }, [filters, isReady]);

  // Setters update URL (which triggers state update) or update state directly
  const updateStateAndUrl = useCallback((updates: Partial<typeof filters>) => {
    setFilters(prev => {
      const nextFilters = { ...prev, ...updates };
      
      // Update URL
      const nextParams = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (key === "customDateRange") {
          const range = value as [Date, Date] | null;
          if (range) {
            nextParams.set("range", "custom");
            nextParams.set("startDate", format(range[0], "yyyy-MM-dd"));
            nextParams.set("endDate", format(range[1], "yyyy-MM-dd"));
          } else {
            nextParams.delete("startDate");
            nextParams.delete("endDate");
          }
          return;
        }

        if (value === "All" || (key === "dateRange" && value === "30")) {
          nextParams.delete(key === "dateRange" ? "range" : key);
        } else {
          nextParams.set(key === "dateRange" ? "range" : key, value as string);
        }
      });

      // Special handling for subscription change: reset others
      if (updates.subscription) {
        nextParams.delete("resourceGroup");
        nextParams.delete("service");
        nextParams.delete("location");
        nextFilters.resourceGroup = "All";
        nextFilters.service = "All";
        nextFilters.location = "All";
      }

      setSearchParams(nextParams, { replace: true });
      return nextFilters;
    });
  }, [searchParams, setSearchParams]);

  const setSubscription = useCallback((v: string) => updateStateAndUrl({ subscription: v }), [updateStateAndUrl]);
  const setResourceGroup = useCallback((v: string) => updateStateAndUrl({ resourceGroup: v }), [updateStateAndUrl]);
  const setService = useCallback((v: string) => updateStateAndUrl({ service: v }), [updateStateAndUrl]);
  const setLocation = useCallback((v: string) => updateStateAndUrl({ location: v }), [updateStateAndUrl]);
  const setDateRange = useCallback((v: string) => updateStateAndUrl({ dateRange: v, customDateRange: null }), [updateStateAndUrl]);
  const setCustomDateRange = useCallback((v: [Date, Date] | null) => updateStateAndUrl({ dateRange: "custom", customDateRange: v }), [updateStateAndUrl]);

  const filterParams = useMemo(() => {
    const [startDate, endDate] = getDateRangeValues(filters.dateRange, filters.customDateRange);
    return {
      subscription: filters.subscription !== "All" ? filters.subscription : undefined,
      resourceGroup: filters.resourceGroup !== "All" ? filters.resourceGroup : undefined,
      service: filters.service !== "All" ? filters.service : undefined,
      location: filters.location !== "All" ? filters.location : undefined,
      startDate,
      endDate,
    };
  }, [filters]);

  const allTimeFilterParams = useMemo(() => {
    const [startDate, endDate] = getDateRangeValues("365");
    return {
      subscription: filters.subscription !== "All" ? filters.subscription : undefined,
      resourceGroup: filters.resourceGroup !== "All" ? filters.resourceGroup : undefined,
      service: filters.service !== "All" ? filters.service : undefined,
      location: filters.location !== "All" ? filters.location : undefined,
      startDate,
      endDate,
    };
  }, [filters.subscription, filters.resourceGroup, filters.service, filters.location]);

  const resetFilters = useCallback(() => {
    localStorage.removeItem(FILTER_STORAGE_KEY);
    setFilters({
      subscription: "All",
      resourceGroup: "All",
      service: "All",
      location: "All",
      dateRange: "30",
      customDateRange: null,
    });
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const value = useMemo(() => ({
    ...filters,
    setSubscription,
    setResourceGroup,
    setService,
    setLocation,
    setDateRange,
    setCustomDateRange,
    filterParams,
    allTimeFilterParams,
    resetFilters,
  }), [filters, setSubscription, setResourceGroup, setService, setLocation, setDateRange, setCustomDateRange, filterParams, allTimeFilterParams, resetFilters]);

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilterContext() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useFilterContext must be used within a FilterProvider");
  }
  return context;
}
