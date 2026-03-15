import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Bell,
  Zap,
  Cloud,
  Search,
  Download,
  Users,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "forecast", label: "Forecast", icon: TrendingUp },
  { id: "alerts", label: "Alerts & Budgets", icon: Bell },
  { id: "optimize", label: "Optimize", icon: Zap },
  { id: "users", label: "User Management", icon: Users },
];

interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onSearchOpen: () => void;
  onExport: () => void;
}

export function AppSidebar({ activeSection, onSectionChange, onSearchOpen, onExport }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 glow-primary relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
            }}
          >
            <Cloud className="h-5 w-5 text-primary-foreground relative z-10" />
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: "linear-gradient(225deg, transparent 40%, hsl(var(--chart-3) / 0.5) 100%)",
              }}
            />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight truncate">Azure Cost Intel</h1>
              <p className="text-[10px] text-muted-foreground font-semibold tracking-[0.2em] flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                CLOUD ANALYTICS
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <Separator className="mx-3 w-auto bg-sidebar-border/50" />

      {/* Quick search */}
      {!collapsed && (
        <div className="px-3 py-3 space-y-1.5">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-xs h-8 bg-sidebar-accent/30 border-sidebar-border/50 text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-200"
            onClick={onSearchOpen}
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Search...</span>
            <kbd className="ml-auto text-[9px] bg-muted/50 px-1.5 py-0.5 rounded font-mono text-muted-foreground border border-border/30">⌘K</kbd>
          </Button>
        </div>
      )}

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold px-3">
            {!collapsed ? "Navigation" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => onSectionChange(item.id)}
                      tooltip={collapsed ? item.label : undefined}
                      className={`
                        relative gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm
                        ${isActive
                          ? "text-primary-foreground shadow-md sidebar-active-glow hover:opacity-90"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                        }
                      `}
                      style={isActive ? {
                        background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))",
                      } : undefined}
                    >
                      <item.icon className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                      {!collapsed && <span>{item.label}</span>}
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active-pill"
                          className="absolute inset-0 rounded-lg -z-10"
                          style={{
                            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))",
                          }}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                        />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Actions */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold px-3">
            {!collapsed ? "Actions" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onExport}
                  tooltip={collapsed ? "Export CSV" : undefined}
                  className="gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-all duration-200"
                >
                  <Download className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Export CSV</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              {collapsed && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={onSearchOpen}
                    tooltip="Search"
                    className="gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-all duration-200"
                  >
                    <Search className="h-4 w-4 shrink-0" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border/30">
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent pulse-ring" />
              <span className="text-[10px] text-muted-foreground font-medium">v2.0 · Live</span>
            </div>
          )}
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
