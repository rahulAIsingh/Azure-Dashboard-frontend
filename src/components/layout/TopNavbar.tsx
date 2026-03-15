import { useLocation, useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { AlertsPanel } from "@/components/alerts/AlertsPanel";
import { AutoRefreshToggle } from "@/components/dashboard/AutoRefreshToggle";
import { NetworkActivityIndicator } from "@/components/ui/NetworkActivityIndicator";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/cost-explorer": "Cost Explorer",
  "/resource-groups": "Resource Groups",
  "/subscriptions": "Subscriptions",
  "/budgets": "Budgets",
  "/finops-insights": "FinOps Insights",
  "/users": "Users",
  "/settings": "Settings",
};

interface TopNavbarProps {
  autoRefresh: number;
  onAutoRefreshChange: (ms: number) => void;
  onSearchOpen: () => void;
}

export function TopNavbar({ autoRefresh, onAutoRefreshChange, onSearchOpen }: TopNavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const title = routeTitles[location.pathname] || "Dashboard";
  const today = format(new Date(), "MMM dd, yyyy");
  const { currentUser, hasFullAccess, allowedSubscriptions, allowedResourceGroups, logout } = useAuth();

  const initials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="premium-header h-12 sm:h-14 flex items-center px-3 sm:px-5 gap-2 sm:gap-3">
      <SidebarTrigger className="shrink-0" />
      <div className="flex items-center gap-2">
        <h2 className="text-sm sm:text-base font-bold text-foreground truncate">{title}</h2>
        <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
      </div>
      <NetworkActivityIndicator />
      <div className="flex-1" />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
        onClick={onSearchOpen}
      >
        <Search className="h-4 w-4" />
      </Button>
      <AutoRefreshToggle value={autoRefresh} onChange={onAutoRefreshChange} />
      <span className="text-xs text-muted-foreground hidden md:inline font-mono">{today}</span>
      <AlertsPanel />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-8 w-8 border border-border/50 cursor-pointer">
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">{currentUser.name}</span>
            <span className="text-xs text-muted-foreground font-normal">{currentUser.email}</span>
          </DropdownMenuLabel>
          <div className="px-2 py-1.5">
            <Badge variant="secondary" className="text-xs capitalize">{currentUser.role}</Badge>
          </div>
          <DropdownMenuSeparator />
          <div className="px-2 py-2 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Access Scope
            </div>
            {hasFullAccess ? (
              <p className="text-xs text-muted-foreground">Full Access — all subscriptions and resource groups</p>
            ) : (
              <div className="space-y-1.5">
                <div>
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Subscriptions
                  </span>
                  <p className="text-xs text-foreground pl-4">
                    {allowedSubscriptions.length > 0 ? allowedSubscriptions.join(", ") : "All"}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Resource Groups
                  </span>
                  <p className="text-xs text-foreground pl-4">
                    {allowedResourceGroups.length > 0 ? allowedResourceGroups.join(", ") : "All"}
                  </p>
                </div>
              </div>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
