import { useState, useEffect, useMemo } from "react";
import { Search, X, Server, Database, HardDrive, Network, Brain, BarChart2, MapPin } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CostRecord } from "@/types/dashboardTypes";
import { formatINR } from "@/lib/currency";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectResource: (resourceName: string, resourceGroup: string) => void;
  records: CostRecord[];
}

interface SearchResult {
  resourceName: string;
  resourceType: string;
  resourceGroup: string;
  serviceName: string;
  location: string;
  totalCost: number;
  avgDailyCost: number;
  subscription: string;
}

const serviceIcons: Record<string, React.ElementType> = {
  "Compute": Server,
  "Storage": HardDrive,
  "Database": Database,
  "Networking": Network,
  "AI + Machine Learning": Brain,
  "Analytics": BarChart2,
};

export function GlobalSearch({ open, onOpenChange, onSelectResource, records }: GlobalSearchProps) {
  const [query, setQuery] = useState("");

  const allResources = useMemo(() => {
    const resourceMap = new Map<string, SearchResult>();

    records.forEach((record) => {
      const key = record.resourceName;
      if (!resourceMap.has(key)) {
        resourceMap.set(key, {
          resourceName: record.resourceName,
          resourceType: record.resourceType,
          resourceGroup: record.resourceGroup,
          serviceName: record.serviceName,
          location: record.location,
          totalCost: 0,
          avgDailyCost: 0,
          subscription: record.subscriptionName,
        });
      }
      const existing = resourceMap.get(key)!;
      existing.totalCost += record.cost;
    });

    const uniqueDays = new Set(records.map((r) => r.usageDate)).size;
    resourceMap.forEach((res) => {
      res.totalCost = Math.round(res.totalCost * 100) / 100;
      res.avgDailyCost = Math.round((res.totalCost / (uniqueDays || 1)) * 100) / 100;
    });

    return Array.from(resourceMap.values());
  }, [records]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return allResources.slice(0, 10);

    const lowerQuery = query.toLowerCase();
    return allResources
      .filter((res) =>
        res.resourceName.toLowerCase().includes(lowerQuery) ||
        res.resourceType.toLowerCase().includes(lowerQuery) ||
        res.resourceGroup.toLowerCase().includes(lowerQuery) ||
        res.serviceName.toLowerCase().includes(lowerQuery) ||
        res.subscription.toLowerCase().includes(lowerQuery) ||
        res.location.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 15);
  }, [query, allResources]);

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = (result: SearchResult) => {
    onSelectResource(result.resourceName, result.resourceGroup);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center border-b border-border px-3 sm:px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground mr-2 sm:mr-3 shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm sm:text-base bg-transparent"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-6 px-2 items-center gap-1 rounded bg-muted text-xs text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-[50vh] sm:max-h-[60vh]">
          <div className="p-1.5 sm:p-2">
            {searchResults.length === 0 ? (
              <div className="py-8 sm:py-12 text-center text-muted-foreground">
                <Search className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm">No resources found for "{query}"</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {searchResults.map((result) => {
                  const Icon = serviceIcons[result.serviceName] || Server;
                  return (
                    <button
                      key={result.resourceName}
                      onClick={() => handleSelect(result)}
                      className="w-full flex items-start gap-2.5 sm:gap-4 p-2.5 sm:p-3 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                          <span className="font-semibold text-foreground text-xs sm:text-sm truncate">{result.resourceName}</span>
                          <Badge variant="secondary" className="text-[9px] sm:text-[10px] shrink-0 hidden xs:inline-flex">{result.serviceName}</Badge>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 truncate">
                            <Server className="h-3 w-3 shrink-0" />
                            {result.resourceGroup}
                          </span>
                          <span className="hidden sm:flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {result.location}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs sm:text-sm font-bold text-foreground">{formatINR(result.totalCost, 0)}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">{formatINR(result.avgDailyCost, 0)}/day</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border px-3 sm:px-4 py-2 flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground bg-muted/30">
          <div className="hidden sm:flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">↵</kbd> Select
            </span>
          </div>
          <span>{searchResults.length} results</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
