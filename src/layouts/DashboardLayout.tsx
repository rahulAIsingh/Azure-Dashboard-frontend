import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { LayoutSidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { GlobalErrorBanner } from "@/components/ui/GlobalErrorBanner";
import { Footer } from "@/components/layout/Footer";
import { GlobalSearch } from "@/components/dashboard/GlobalSearch";
import { useFilteredRecords } from "@/hooks/useFilteredRecords";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardLayout() {
  const [autoRefresh, setAutoRefresh] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  const filters = useDashboardFilters();
  const { allowedSubscriptions, allowedResourceGroups } = useAuth();

  // Fetch all records for global search
  const { data: allRecords = [] } = useFilteredRecords(filters.filterParams);

  const handleSelectResource = (resourceName: string, resourceGroup: string) => {
    setSearchOpen(false);
    navigate(`/resource-groups?rg=${resourceGroup}`);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <LayoutSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <GlobalErrorBanner />
          <TopNavbar
            autoRefresh={autoRefresh}
            onAutoRefreshChange={setAutoRefresh}
            onSearchOpen={() => setSearchOpen(true)}
          />
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
              <div className="glass-card p-3 sm:p-4 mb-4">
                <DashboardFilters
                  subscription={filters.subscription} resourceGroup={filters.resourceGroup}
                  service={filters.service} location={filters.location}
                  dateRange={filters.dateRange} customDateRange={filters.customDateRange}
                  onSubscriptionChange={filters.setSubscription} onResourceGroupChange={filters.setResourceGroup}
                  onServiceChange={filters.setService} onLocationChange={filters.setLocation}
                  onDateRangeChange={filters.setDateRange} onCustomDateRangeChange={filters.setCustomDateRange}
                  allowedSubscriptions={allowedSubscriptions}
                  allowedResourceGroups={allowedResourceGroups}
                />
              </div>
              <Outlet context={{ autoRefresh }} />
            </div>
          </main>
          <Footer />
        </div>
      </div>



      <GlobalSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        records={allRecords}
        onSelectResource={handleSelectResource}
      />
    </SidebarProvider>
  );
}
