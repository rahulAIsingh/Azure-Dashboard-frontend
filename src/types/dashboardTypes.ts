// ============================================================
// Centralized TypeScript type definitions for the Azure Cost Dashboard.
// These interfaces mirror the .NET Core backend DTOs.
// ============================================================

export interface DashboardSummary {
  totalCostThisMonth: number;
  totalCostThisYear: number;
  averageDailyCost: number;
  totalResources: number;
}

export interface ResourceGroupCost {
  resourceGroup: string;
  cost: number;
}

export interface ServiceCost {
  service: string;
  cost: number;
}

export interface DailyCost {
  date: string;
  cost: number;
}

export interface ResourceCost {
  resourceName: string;
  resourceType?: string;
  serviceName: string;
  location?: string;
  cost: number;
}

export interface SubscriptionCost {
  subscription: string;
  cost: number;
}

export interface TopResource {
  resourceName: string;
  cost: number;
}

export interface CostRecord {
  id: string;
  usageDate: string;
  subscriptionName: string;
  resourceGroup: string;
  resourceName: string;
  resourceType: string;
  serviceName: string;
  /** Meter name — e.g. "B4ms", "P1v2", "General Purpose" */
  resourcePlan?: string;
  meterCategory: string;
  location: string;
  cost: number;
}

// Filter parameters sent to the API
export interface FilterParams {
  subscription?: string;
  resourceGroup?: string;
  service?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
}

// Budget alert types
export interface BudgetAlert {
  id: string;
  name: string;
  scope: string;
  scopeValue: string;
  budget: number;
  alertAt: number;
}

export interface BudgetAlertDto {
  id: string;
  name: string;
  scope: string;
  scopeValue: string;
  budgetAmount: number;
  alertAtPercent: number;
  currentSpend: number;
  percentUsed: number;
}

export interface CreateBudgetDto {
  name: string;
  scope: string;
  scopeValue: string;
  budgetAmount: number;
  alertAtPercent: number;
}

export type UserRole = "admin" | "viewer" | "editor";

export interface AccessScope {
  type: "subscription" | "resourceGroup";
  value: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  assignedResourceGroups: string[];
  scopes?: AccessScope[];
  avatar?: string;
  department?: string;
  lastActive?: string;
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  assignedResourceGroups: string[];
  scopes?: AccessScope[];
  lastActive?: string;
}

export interface CreateUserDto {
  user: {
    name: string;
    email: string;
    password?: string;
    roleId: string;
    department?: string;
    isActive: boolean;
  };
  scopes: {
    scopeType: string;
    scopeValue: string;
  }[];
}

export interface UpdateUserDto {
  user: {
    name?: string;
    email?: string;
    password?: string;
    roleId?: string;
    department?: string;
    isActive?: boolean;
  };
  scopes: {
    scopeType: string;
    scopeValue: string;
  }[];
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    scopes: string[];
  };
}

// Lookup data (for filter dropdowns)
export interface LookupData {
  subscriptions: string[];
  resourceGroups: string[];
  services: string[];
  locations: string[];
}

export interface ManualPricingImportSummary {
  workbookPath: string;
  subscriptionName: string;
  effectiveUsageDate: string;
  currency: string;
  totalExcelRowsRead: number;
  eligibleChargeRows: number;
  distinctAggregatedResources: number;
  matchedResourcesInserted: number;
  unmatchedResources: number;
  skippedRows: number;
  totalImportedAmtInr: number;
}
