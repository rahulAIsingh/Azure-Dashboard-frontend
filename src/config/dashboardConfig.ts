// ============================================================
// Dashboard configuration — toggle modules on/off
// ============================================================

export interface DashboardConfig {
  enabledModules: {
    budgets: boolean;
    forecasts: boolean;
    insights: boolean;
    alerts: boolean;
    costExplorer: boolean;
    subscriptions: boolean;
    resourceGroups: boolean;
  };
  defaultDateRange: string;
  autoRefreshInterval: number; // 0 = off, ms value otherwise
  maxTopResources: number;
  currency: "INR" | "USD" | "EUR";
}

export const defaultDashboardConfig: DashboardConfig = {
  enabledModules: {
    budgets: true,
    forecasts: true,
    insights: true,
    alerts: true,
    costExplorer: true,
    subscriptions: true,
    resourceGroups: true,
  },
  defaultDateRange: "30",
  autoRefreshInterval: 0,
  maxTopResources: 10,
  currency: "INR",
};

// Load persisted config from localStorage
export function loadDashboardConfig(): DashboardConfig {
  try {
    const stored = localStorage.getItem("dashboardConfig");
    if (stored) return { ...defaultDashboardConfig, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return defaultDashboardConfig;
}

export function saveDashboardConfig(config: Partial<DashboardConfig>): void {
  const current = loadDashboardConfig();
  const updated = { ...current, ...config };
  localStorage.setItem("dashboardConfig", JSON.stringify(updated));
}
