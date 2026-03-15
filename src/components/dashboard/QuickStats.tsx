import { useState, useEffect } from "react";
import { RefreshCw, Clock, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";

interface QuickStatsProps {
  onRefresh: () => void;
}

export function QuickStats({ onRefresh }: QuickStatsProps) {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLastRefresh(new Date());
    onRefresh();
    setIsRefreshing(false);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Connection Status - hidden on very small screens */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md text-xs ${isOnline ? "text-kpi-up bg-kpi-up/10" : "text-destructive bg-destructive/10"}`}>
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              <span className="hidden md:inline">{isOnline ? "Live" : "Offline"}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isOnline ? "Connected to Azure" : "Connection lost"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Last Refresh - hidden on mobile */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-muted-foreground bg-muted/50">
              <Clock className="h-3 w-3" />
              <span>{format(lastRefresh, "HH:mm")}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Last refreshed: {format(lastRefresh, "MMM d, HH:mm:ss")}</p>
          </TooltipContent>
        </Tooltip>

        {/* Refresh Button - always visible */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh data</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
