import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { FilterProvider } from "@/contexts/FilterContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import Index from "./pages/Index";
import CostExplorerPage from "./pages/CostExplorerPage";
import ResourceGroupsPage from "./pages/ResourceGroupsPage";
import ResourceGroupDetailPage from "./pages/ResourceGroupDetailPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import BudgetsPage from "./pages/BudgetsPage";
import FinOpsInsightsPage from "./pages/FinOpsInsightsPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <FilterProvider>
            <AuthProvider>
              <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/access-denied" element={<AccessDeniedPage />} />
              <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Index />} />
                <Route path="/cost-explorer" element={<CostExplorerPage />} />
                <Route path="/resource-groups" element={<ResourceGroupsPage />} />
                <Route path="/resource-group/:resourceGroup" element={<ResourceGroupDetailPage />} />
                <Route path="/service/:service" element={<ServiceDetailPage />} />
                <Route path="/subscriptions" element={<SubscriptionsPage />} />
                <Route path="/budgets" element={<BudgetsPage />} />
                <Route path="/finops-insights" element={<FinOpsInsightsPage />} />
                <Route
                  path="/users"
                  element={<ProtectedRoute allowedRoles={["super admin", "admin"]}><UsersPage /></ProtectedRoute>}
                />
                <Route
                  path="/settings"
                  element={<ProtectedRoute allowedRoles={["super admin"]}><SettingsPage /></ProtectedRoute>}
                />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </FilterProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
