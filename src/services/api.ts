// ============================================================
// Unified API Service Layer
// ============================================================
// Switches between real .NET Core API and mock data based on:
//   VITE_USE_MOCK_DATA=true   → always use mocks
//   VITE_API_URL not set      → fallback to mocks
//   Otherwise                 → call real API
// ============================================================

import type {
  DashboardSummary,
  ResourceGroupCost,
  ServiceCost,
  DailyCost,
  TopResource,
  SubscriptionCost,
  ResourceCost,
  FilterParams,
  CostRecord,
  LookupData,
  ManualPricingImportSummary,
  UserDto,
  CreateUserDto,
  UpdateUserDto,
  BudgetAlertDto,
  CreateBudgetDto,
  UserRole,
  LoginRequestDto,
  LoginResponseDto,
} from "@/types/dashboardTypes";

import {
  mockGetDashboardSummary,
  mockGetCostByResourceGroup,
  mockGetCostByService,
  mockGetDailyCost,
  mockGetSubscriptionCost,
  mockGetResourceGroupDetail,
} from "@/mocks/mockDashboardData";

// ---- Configuration ----

const API_BASE = import.meta.env.VITE_API_URL as string | undefined;
const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === "true" || !API_BASE;

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

// ---- API Error ----

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body?: unknown
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

// ---- HTTP Helpers ----

function buildQuery(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string] => entry[1] != null && entry[1] !== "" && entry[1] !== "All"
  );
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries).toString();
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) {
    throw new ApiError(0, "VITE_API_URL not configured");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...init?.headers as Record<string, string>,
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    let body: unknown;
    try { body = await res.json(); } catch { /* ignore */ }
    throw new ApiError(res.status, res.statusText, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function uploadForm<T>(path: string, formData: FormData): Promise<T> {
  if (!API_BASE) {
    throw new ApiError(0, "VITE_API_URL not configured");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let body: unknown;
    try { body = await res.json(); } catch { /* ignore */ }
    throw new ApiError(res.status, res.statusText, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function filterQuery(f: FilterParams) {
  return buildQuery({
    subscription: f.subscription,
    resourceGroup: f.resourceGroup,
    service: f.service,
    location: f.location,
    startDate: f.startDate,
    endDate: f.endDate,
  });
}

// ---- Dashboard API ----

export const dashboardApi = {
  getSummary: async (filters: FilterParams = {}): Promise<DashboardSummary> => {
    if (USE_MOCK) return mockGetDashboardSummary(filters);
    const data = await request<any>(`/dashboard/summary${filterQuery(filters)}`);
    return {
      totalCostThisMonth: data.totalCostThisMonth || 0,
      totalCostThisYear: data.totalCostThisYear || 0,
      averageDailyCost: data.averageDailyCost || 0,
      totalResources: data.activeResourcesCount || 0,
    };
  },

  getCostByResourceGroup: async (filters: FilterParams = {}): Promise<ResourceGroupCost[]> => {
    if (USE_MOCK) return mockGetCostByResourceGroup(filters);
    const data = await request<any[]>(`/cost/by-resource-group${filterQuery(filters)}`);
    return data.map((d) => ({ resourceGroup: d.resourceGroup, cost: d.totalCost || 0 }));
  },

  getCostByService: async (filters: FilterParams = {}): Promise<ServiceCost[]> => {
    if (USE_MOCK) return mockGetCostByService(filters);
    const data = await request<any[]>(`/cost/by-service${filterQuery(filters)}`);
    return data.map((d) => ({ service: d.serviceName, cost: d.totalCost || 0 }));
  },

  getDailyCost: async (filters: FilterParams = {}): Promise<DailyCost[]> => {
    if (USE_MOCK) return mockGetDailyCost(filters);
    const data = await request<any[]>(`/cost/daily-trend${filterQuery(filters)}`);
    return data.map((d) => ({ date: d.date, cost: d.totalCost || 0 }));
  },

  getTopResources: async (filters: FilterParams = {}, limit = 10): Promise<TopResource[]> => {
    if (USE_MOCK) return [];
    const data = await request<any[]>(`/cost/top-resources${filterQuery(filters)}&limit=${limit}`);
    return data.map((d) => ({ resourceName: d.resourceName, cost: d.totalCost || 0 }));
  },

  getSubscriptionCost: async (filters: FilterParams = {}): Promise<SubscriptionCost[]> => {
    if (USE_MOCK) return mockGetSubscriptionCost(filters);
    const data = await request<any[]>(`/cost/subscription-cost${filterQuery(filters)}`);
    return data.map((d) => ({ subscription: d.subscriptionName, cost: d.totalCost || 0 }));
  },

  getResourceGroupDetail: async (resourceGroup: string, filters: FilterParams = {}): Promise<ResourceCost[]> => {
    if (USE_MOCK) return mockGetResourceGroupDetail(resourceGroup, filters);
    return request<ResourceCost[]>(`/cost/resource-group-detail${buildQuery({ ...filters, resourceGroup })}`);
  },

  getFilteredRecords: async (filters: FilterParams = {}): Promise<CostRecord[]> => {
    if (USE_MOCK) return [];
    return request<CostRecord[]>(`/cost/records${filterQuery(filters)}`);
  },

  getLookups: async (subscription?: string): Promise<LookupData> => {
    if (USE_MOCK) return { subscriptions: [], resourceGroups: [], services: [], locations: [] };
    const query = subscription && subscription !== "All" ? `?subscription=${encodeURIComponent(subscription)}` : "";
    const data = await request<any>(`/cost/lookups${query}`);
    return {
      subscriptions: data.subscriptions || [],
      resourceGroups: data.resourceGroups || [],
      services: data.services || [],
      locations: data.locations || [],
    };
  },
};

// ---- Auth API ----

export const authApi = {
  login: (data: LoginRequestDto) => request<LoginResponseDto>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
};

// ---- Users API ----

export const usersApi = {
  getAll: () => request<UserDto[]>("/users"),
  getRoles: () => request<any[]>("/users/roles"),
  getById: (id: string) => request<UserDto>(`/users/${id}`),
  create: (data: any) => request<UserDto>("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<void>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/users/${id}`, { method: "DELETE" }),
  updateRole: (id: string, role: UserRole) => request<void>(`/users/${id}/role`, { method: "PUT", body: JSON.stringify({ role }) }),
  updateResourceGroups: (id: string, resourceGroupIds: number[]) =>
    request<void>(`/users/${id}/resource-groups`, { method: "PUT", body: JSON.stringify({ resourceGroupIds }) }),
};

// ---- Budget Alerts API ----

export const budgetApi = {
  getAll: () => request<BudgetAlertDto[]>("/budgetalerts"),
  create: (data: CreateBudgetDto) => request<BudgetAlertDto>("/budgetalerts", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/budgetalerts/${id}`, { method: "DELETE" }),
  getStatus: (id: string) => request<BudgetAlertDto>(`/budgetalerts/${id}/status`),
};

export const settingsApi = {
  importManualPricingWorkbook: async (file: File, subscriptionName: string, effectiveUsageDate?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("subscriptionName", subscriptionName);
    if (effectiveUsageDate) {
      formData.append("effectiveUsageDate", effectiveUsageDate);
    }

    return uploadForm<ManualPricingImportSummary>("/settings/manual-pricing-import", formData);
  },
};

// ---- Health check ----

export async function isApiAvailable(): Promise<boolean> {
  if (USE_MOCK) return false;
  try {
    const res = await fetch(`${API_BASE}/dashboard/summary`, { method: "HEAD", signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

export { USE_MOCK };
