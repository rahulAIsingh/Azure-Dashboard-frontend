import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, IndianRupee, TrendingUp, Server, X, Bell,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Alert {
  id: string;
  type: "budget" | "spike" | "forecast" | "idle";
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  timestamp: string;
}

const mockAlerts: Alert[] = [
  { id: "1", type: "budget", title: "Prod-RG Budget Exceeded", description: "Production resource group has exceeded its monthly budget of ₹5,000", severity: "critical", timestamp: "2 min ago" },
  { id: "2", type: "spike", title: "Cost Spike: aks-prod-cluster", description: "AKS cluster cost increased by 45% in the last 24 hours", severity: "warning", timestamp: "15 min ago" },
  { id: "3", type: "forecast", title: "Month-end Forecast Risk", description: "Projected month-end cost exceeds budget by ₹1,200", severity: "warning", timestamp: "1 hour ago" },
  { id: "4", type: "idle", title: "Idle Resource: vm-dev-01", description: "Development VM has been idle for 7 days", severity: "info", timestamp: "3 hours ago" },
  { id: "5", type: "budget", title: "Data-RG Near Limit", description: "Data resource group is at 85% of monthly budget", severity: "warning", timestamp: "5 hours ago" },
  { id: "6", type: "spike", title: "Storage Cost Increase", description: "Blob storage costs rose 22% week-over-week", severity: "info", timestamp: "1 day ago" },
];

const iconMap = {
  budget: IndianRupee,
  spike: TrendingUp,
  forecast: AlertTriangle,
  idle: Server,
};

const severityColors = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  warning: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  info: "bg-primary/15 text-primary border-primary/30",
};

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [open, setOpen] = useState(false);

  const dismiss = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const unreadCount = alerts.length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[380px] sm:w-[420px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Alerts
            <Badge variant="outline" className="ml-auto">{alerts.length}</Badge>
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-2">
          <AnimatePresence>
            {alerts.map((alert) => {
              const Icon = iconMap[alert.type];
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  className={`mb-3 p-3 rounded-lg border ${severityColors[alert.severity]}`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs opacity-80 mt-0.5">{alert.description}</p>
                      <p className="text-[10px] opacity-60 mt-1">{alert.timestamp}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => dismiss(alert.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {alerts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">No alerts</p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
