import { useEffect, useMemo, useState } from "react";
import { subDays, format, startOfMonth, endOfMonth } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, ChevronDown, Filter, Lock, MapPin, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLookups } from "@/hooks/useLookups";
import { cn } from "@/lib/utils";
import { JANUARY_2026_PRICING_RANGE_VALUE } from "@/contexts/FilterContext";

interface FiltersProps {
  subscription: string;
  resourceGroup: string;
  service: string;
  location: string;
  dateRange: string;
  customDateRange?: [Date, Date] | null;
  onSubscriptionChange: (v: string) => void;
  onResourceGroupChange: (v: string) => void;
  onServiceChange: (v: string) => void;
  onLocationChange: (v: string) => void;
  onDateRangeChange: (v: string) => void;
  onCustomDateRangeChange?: (range: [Date, Date] | null) => void;
  allowedSubscriptions?: string[];
  allowedResourceGroups?: string[];
}

const dateRangeOptions = [
  { label: "January 2026 pricing", value: JANUARY_2026_PRICING_RANGE_VALUE, icon: Lock },
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 3 months", value: "90" },
  { label: "Last 1 year", value: "365" },
];

export function getDateRangeValues(range: string, customRange?: [Date, Date] | null): [string, string] {
  if (range === JANUARY_2026_PRICING_RANGE_VALUE) {
    return ["2026-01-01", "2026-01-31"];
  }
  if (range === "custom" && customRange) {
    return [format(customRange[0], "yyyy-MM-dd"), format(customRange[1], "yyyy-MM-dd")];
  }
  const days = Number.isNaN(parseInt(range, 10)) ? 30 : parseInt(range, 10);
  const end = format(new Date(), "yyyy-MM-dd");
  const start = format(subDays(new Date(), days), "yyyy-MM-dd");
  return [start, end];
}

export function DashboardFilters({
  subscription,
  resourceGroup,
  service,
  location,
  dateRange,
  customDateRange,
  onSubscriptionChange,
  onResourceGroupChange,
  onServiceChange,
  onLocationChange,
  onDateRangeChange,
  onCustomDateRangeChange,
  allowedSubscriptions = [],
  allowedResourceGroups = [],
}: FiltersProps) {
  const [open, setOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange | undefined>(
    customDateRange ? { from: customDateRange[0], to: customDateRange[1] } : undefined,
  );
  const [viewedMonth, setViewedMonth] = useState<Date>(
    customDateRange?.[0] || new Date()
  );

  const [startDateStr, endDateStr] = useMemo(() => getDateRangeValues(dateRange, customDateRange), [dateRange, customDateRange]);
  const { data: lookups } = useLookups(subscription, startDateStr, endDateStr);

  // Sync tempRange when customDateRange changes externally
  useEffect(() => {
    if (customDateRange) {
      const newRange = { from: customDateRange[0], to: customDateRange[1] };
      // Only set if actually different to avoid disrupting user selection
      if (!tempRange || tempRange.from?.getTime() !== newRange.from.getTime() || tempRange.to?.getTime() !== newRange.to.getTime()) {
        setTempRange(newRange);
      }
    } else {
      setTempRange(undefined);
    }
  }, [customDateRange]);

  // Sync viewedMonth when customDateRange changes externally
  useEffect(() => {
    if (customDateRange?.[0]) {
      setViewedMonth(customDateRange[0]);
    } else if (dateRange === JANUARY_2026_PRICING_RANGE_VALUE) {
      setViewedMonth(new Date(2026, 0, 1));
    }
  }, [customDateRange, dateRange]);

  const handleApply = () => {
    let finalRange: [Date, Date] | null = null;

    if (tempRange?.from && tempRange?.to) {
      finalRange = [tempRange.from, tempRange.to];
    } else if (tempRange?.from) {
      finalRange = [tempRange.from, tempRange.from];
    } else {
      // Nothing selected -> use the entire viewed month
      finalRange = [startOfMonth(viewedMonth), endOfMonth(viewedMonth)];
    }

    if (finalRange) {
      // Check if it's the January 2026 pricing range
      const isJan2026 = format(finalRange[0], "yyyy-MM") === "2026-01" && 
                        format(finalRange[1], "yyyy-MM-dd") === "2026-01-31";
      
      if (isJan2026) {
        onDateRangeChange(JANUARY_2026_PRICING_RANGE_VALUE);
      } else {
        // This will update range=custom AND startDate/endDate in one URL update
        onCustomDateRangeChange?.(finalRange);
      }
      setCalendarOpen(false);
    }
  };

  const handleCancel = () => {
    if (customDateRange) {
      setTempRange({ from: customDateRange[0], to: customDateRange[1] });
    } else {
      setTempRange(undefined);
    }
    setCalendarOpen(false);
  };
  const allSubscriptions = (lookups.subscriptions || []).filter(Boolean);
  const allResourceGroups = (lookups.resourceGroups || []).filter(Boolean);
  const allServices = (lookups.services || []).filter(Boolean);
  const allLocations = (lookups.locations || []).filter(Boolean);

  const visibleSubscriptions = useMemo(
    () => (allowedSubscriptions.length > 0 ? allSubscriptions.filter((s) => allowedSubscriptions.includes(s)) : allSubscriptions),
    [allowedSubscriptions, allSubscriptions],
  );

  const visibleResourceGroups = useMemo(
    () => (allowedResourceGroups.length > 0 ? allResourceGroups.filter((rg) => allowedResourceGroups.includes(rg)) : allResourceGroups),
    [allowedResourceGroups, allResourceGroups],
  );

  useEffect(() => {
    if (subscription !== "All" && visibleSubscriptions.length > 0 && !visibleSubscriptions.includes(subscription)) {
      onSubscriptionChange("All");
    }
  }, [onSubscriptionChange, subscription, visibleSubscriptions]);

  useEffect(() => {
    if (resourceGroup !== "All" && !visibleResourceGroups.includes(resourceGroup)) {
      onResourceGroupChange("All");
    }
  }, [onResourceGroupChange, resourceGroup, visibleResourceGroups]);

  useEffect(() => {
    if (service !== "All" && !allServices.includes(service)) {
      onServiceChange("All");
    }
  }, [allServices, onServiceChange, service]);

  useEffect(() => {
    if (location !== "All" && !allLocations.includes(location)) {
      onLocationChange("All");
    }
  }, [allLocations, location, onLocationChange]);

  const isScoped = allowedSubscriptions.length > 0 || allowedResourceGroups.length > 0;
  const hasActiveFilters = subscription !== "All" || resourceGroup !== "All" || service !== "All" || location !== "All" || dateRange !== "30";

  const handleReset = () => {
    onSubscriptionChange("All");
    onResourceGroupChange("All");
    onServiceChange("All");
    onLocationChange("All");
    onDateRangeChange("30");
    onCustomDateRangeChange?.(null);
  };



  const filterSelects = (
    <>
      <Select value={subscription} onValueChange={onSubscriptionChange}>
        <SelectTrigger className="h-9 w-full border-border bg-card text-sm sm:w-[170px]">
          <SelectValue placeholder="Subscription" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Subscriptions</SelectItem>
          {visibleSubscriptions.map((value) => (
            <SelectItem key={value} value={value}>
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative">
        <Select value={resourceGroup} onValueChange={onResourceGroupChange}>
          <SelectTrigger className="h-9 w-full border-border bg-card text-sm sm:w-[170px]">
            <SelectValue placeholder="Resource Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Resource Groups</SelectItem>
            {visibleResourceGroups.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isScoped && <Lock className="absolute -right-1 -top-1 h-3 w-3 text-chart-4" />}
      </div>

      <Select value={service} onValueChange={onServiceChange}>
        <SelectTrigger className="h-9 w-full border-border bg-card text-sm sm:w-[170px]">
          <SelectValue placeholder="Service" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Services</SelectItem>
          {allServices.map((value) => (
            <SelectItem key={value} value={value}>
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={location} onValueChange={onLocationChange}>
        <SelectTrigger className="h-9 w-full border-border bg-card text-sm sm:w-[155px]">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <SelectValue placeholder="Location" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Locations</SelectItem>
          {allLocations.map((value) => (
            <SelectItem key={value} value={value}>
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className="space-y-3">
      {isScoped && (
        <div className="flex items-center gap-1.5 text-[10px] text-chart-4">
          <Lock className="h-3 w-3" />
          <span>Scope-restricted view - showing only your assigned resources</span>
        </div>
      )}

      <div className="hidden items-center gap-2 sm:flex sm:flex-wrap">
        {filterSelects}

        <div className="flex flex-col gap-1.5 min-w-[240px]">
          <span className="text-[11px] font-semibold text-muted-foreground/80 tracking-tight ml-0.5">Quick Date Selection</span>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-10 px-3 border-border bg-card text-sm font-medium justify-between shadow-sm transition-all duration-200",
                  "hover:border-primary/50 hover:bg-accent/5",
                  calendarOpen && "ring-2 ring-primary/40 border-primary shadow-[0_0_0_4px_rgba(37,99,235,0.1)]",
                  dateRange === "custom" && "border-primary/50 text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  <span className="text-foreground font-medium">
                    {customDateRange 
                      ? `${format(customDateRange[0], "MMMM d, yyyy")} - ${format(customDateRange[1], "MMMM d, yyyy")}` 
                      : (dateRange === JANUARY_2026_PRICING_RANGE_VALUE 
                          ? "January 1, 2026 - January 31, 2026" 
                          : dateRangeOptions.find(o => o.value === dateRange)?.label || "Select date range")}
                  </span>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground/60 transition-transform duration-200", calendarOpen && "rotate-180")} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto border-border bg-card p-0 shadow-xl" align="start">
              <div className="p-1">
                <Calendar 
                  mode="range" 
                  selected={tempRange} 
                  onSelect={setTempRange} 
                  month={viewedMonth}
                  onMonthChange={setViewedMonth}
                  numberOfMonths={1} 
                  className="p-3" 
                />
                <div className="flex items-center justify-end gap-2 border-t border-border p-3 bg-muted/20">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-4 text-xs font-medium"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="h-8 px-6 text-xs font-semibold shadow-sm"
                    onClick={handleApply}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground" onClick={handleReset}>
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
        )}
      </div>

      <div className="sm:hidden">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between gap-2">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5" />
                Filters
                {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {filterSelects}

            <div className="w-full">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-9 w-full gap-2 text-sm justify-between px-3", dateRange === "custom" && "border-primary text-primary")}>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {customDateRange ? `${format(customDateRange[0], "MMM d")} - ${format(customDateRange[1], "MMM d")}` : "Select Range"}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[calc(100vw-2rem)] border-border bg-card p-0 shadow-xl" align="center" side="top">
                  <div className="p-1">
                    <Calendar 
                      mode="range" 
                      selected={tempRange} 
                      onSelect={setTempRange} 
                      month={viewedMonth}
                      onMonthChange={setViewedMonth}
                      className="p-1"
                      numberOfMonths={1}
                    />
                    <div className="flex items-center justify-end gap-2 border-t border-border p-3 bg-muted/20">
                      <Button variant="ghost" size="sm" className="h-8 text-xs font-medium" onClick={handleCancel}>
                        Cancel
                      </Button>
                      <Button variant="default" size="sm" className="h-8 px-4 text-xs font-semibold shadow-sm" onClick={handleApply}>
                        Apply
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs" onClick={handleReset}>
                <RotateCcw className="h-3 w-3" /> Reset Filters
              </Button>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
