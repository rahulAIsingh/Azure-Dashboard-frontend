import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Search, Layers, Server, CreditCard, Target, Lightbulb, Settings, Users,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel,
  SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/data/usersData";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  /** If set, only these roles see this item */
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Cost Explorer", path: "/cost-explorer", icon: Search },
  { label: "Resource Groups", path: "/resource-groups", icon: Layers },
  { label: "Subscriptions", path: "/subscriptions", icon: CreditCard, roles: ["super admin", "admin", "editor"] },
  { label: "Budgets", path: "/budgets", icon: Target, roles: ["super admin", "admin", "editor"] },
  { label: "FinOps Insights", path: "/finops-insights", icon: Lightbulb, roles: ["super admin", "admin", "editor"] },
  { label: "Users", path: "/users", icon: Users, roles: ["super admin", "admin"] },
  { label: "Settings", path: "/settings", icon: Settings, roles: ["super admin"] },
];

export function LayoutSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(currentUser.role)
  );

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" || location.pathname === "/dashboard" : location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3">
        {!collapsed && (
          <div className="flex items-center gap-2 px-1">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Server className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm text-foreground tracking-tight">Azure Cost Intel</span>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Server className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={active}
                      onClick={() => navigate(item.path)}
                      tooltip={item.label}
                    >
                      <div className="relative">
                        <item.icon className="h-4 w-4" />
                        {active && (
                          <motion.div
                            layoutId="sidebar-nav-pill"
                            className="absolute inset-0 -m-1 rounded-md bg-primary/15 sidebar-active-glow"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                          />
                        )}
                      </div>
                      {!collapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className={`flex ${collapsed ? "justify-center" : "items-center justify-between px-1"}`}>
          {!collapsed && <span className="text-[10px] text-muted-foreground font-mono">v2.0.0</span>}
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
