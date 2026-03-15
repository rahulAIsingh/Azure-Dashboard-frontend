// ============================================================
// Mock data layer — used when VITE_USE_MOCK_DATA=true or API unavailable.
// Wraps the existing data generators with the standardised DTO shapes.
// ============================================================

import {
  allRecords,
  getFilteredRecords as _getFilteredRecords,
  getSummary as _getSummary,
  getCostByResourceGroup as _getCostByRG,
  getCostByService as _getCostByService,
  getDailyCost as _getDailyCost,
  getTopResources as _getTopResources,
  getCostBySubscription as _getCostBySub,
  getResourceGroupDetail as _getRGDetail,
  allSubscriptions,
  allResourceGroups,
  allServices,
  allLocations,
} from "@/data/mockData";

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
} from "@/types/dashboardTypes";

// Re-export raw records for components that still need them
export { allRecords, allSubscriptions, allResourceGroups, allServices, allLocations };

// Small delay to simulate network latency in mock mode
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

function buildFilterArgs(params: FilterParams) {
  return {
    subscription: params.subscription,
    resourceGroup: params.resourceGroup,
    service: params.service,
    location: params.location,
    dateRange: params.startDate && params.endDate ? [params.startDate, params.endDate] as [string, string] : undefined,
  };
}

export async function mockGetDashboardSummary(filters: FilterParams): Promise<DashboardSummary> {
  await delay();
  const filterArgs = buildFilterArgs(filters);
  const filteredRecords = _getFilteredRecords(filterArgs);
  
  // Also get records for the same subscription/RG but WITHOUT the date filter
  // This allows us to calculate "This Month" and "This Year" correctly even if 
  // the user has selected a narrow date range.
  const scopeArgs = { ...filterArgs, dateRange: undefined as [string, string] | undefined };
  const allScopeRecords = _getFilteredRecords(scopeArgs);
  
  return _getSummary(filteredRecords, allScopeRecords);
}

export async function mockGetCostByResourceGroup(filters: FilterParams): Promise<ResourceGroupCost[]> {
  await delay();
  const records = _getFilteredRecords(buildFilterArgs(filters));
  return _getCostByRG(records);
}

export async function mockGetCostByService(filters: FilterParams): Promise<ServiceCost[]> {
  await delay();
  const records = _getFilteredRecords(buildFilterArgs(filters));
  return _getCostByService(records);
}

export async function mockGetDailyCost(filters: FilterParams): Promise<DailyCost[]> {
  await delay();
  const records = _getFilteredRecords(buildFilterArgs(filters));
  return _getDailyCost(records);
}

export async function mockGetTopResources(filters: FilterParams, limit = 10): Promise<TopResource[]> {
  await delay();
  const records = _getFilteredRecords(buildFilterArgs(filters));
  return _getTopResources(records, limit);
}

export async function mockGetSubscriptionCost(filters: FilterParams): Promise<SubscriptionCost[]> {
  await delay();
  const records = _getFilteredRecords(buildFilterArgs(filters));
  return _getCostBySub(records);
}

export async function mockGetResourceGroupDetail(resourceGroup: string, filters: FilterParams): Promise<ResourceCost[]> {
  await delay();
  const records = _getFilteredRecords(buildFilterArgs(filters));
  return _getRGDetail(records, resourceGroup).map((r) => ({
    resourceName: r.resourceName,
    resourceType: r.resourceType,
    serviceName: r.serviceName,
    cost: r.cost,
  }));
}

export async function mockGetFilteredRecords(filters: FilterParams): Promise<CostRecord[]> {
  await delay(100);
  return _getFilteredRecords(buildFilterArgs(filters));
}

export async function mockGetLookups(): Promise<LookupData> {
  await delay(50);
  return {
    subscriptions: allSubscriptions,
    resourceGroups: allResourceGroups,
    services: allServices,
    locations: allLocations,
  };
}
