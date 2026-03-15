import { subDays, format } from "date-fns";

export interface CostRecord {
  id: string;
  usageDate: string;
  subscriptionName: string;
  resourceGroup: string;
  resourceName: string;
  resourceType: string;
  serviceName: string;
  meterCategory: string;
  location: string;
  cost: number;
}

const subscriptions = ["Production-Sub", "Development-Sub", "Staging-Sub"];
const resourceGroups = ["Prod-RG", "Dev-RG", "Staging-RG", "Data-RG", "ML-RG", "Network-RG"];
const services = ["Compute", "Storage", "Database", "Networking", "AI + Machine Learning", "Analytics"];
const locations = ["East US", "West Europe", "Southeast Asia", "Central US"];

export const allLocations = [...locations];

const resources: { name: string; type: string; service: string; rg: string; sub: string; baseCost: number }[] = [
  { name: "vm-prod-web-01", type: "Microsoft.Compute/virtualMachines", service: "Compute", rg: "Prod-RG", sub: "Production-Sub", baseCost: 8.5 },
  { name: "vm-prod-web-02", type: "Microsoft.Compute/virtualMachines", service: "Compute", rg: "Prod-RG", sub: "Production-Sub", baseCost: 8.5 },
  { name: "vm-prod-api-01", type: "Microsoft.Compute/virtualMachines", service: "Compute", rg: "Prod-RG", sub: "Production-Sub", baseCost: 12.0 },
  { name: "sql-prod-main", type: "Microsoft.Sql/servers", service: "Database", rg: "Prod-RG", sub: "Production-Sub", baseCost: 18.0 },
  { name: "cosmos-prod", type: "Microsoft.DocumentDB/databaseAccounts", service: "Database", rg: "Data-RG", sub: "Production-Sub", baseCost: 22.0 },
  { name: "storage-prod-blob", type: "Microsoft.Storage/storageAccounts", service: "Storage", rg: "Prod-RG", sub: "Production-Sub", baseCost: 4.2 },
  { name: "storage-prod-files", type: "Microsoft.Storage/storageAccounts", service: "Storage", rg: "Prod-RG", sub: "Production-Sub", baseCost: 2.8 },
  { name: "aks-prod-cluster", type: "Microsoft.ContainerService/managedClusters", service: "Compute", rg: "Prod-RG", sub: "Production-Sub", baseCost: 25.0 },
  { name: "appgw-prod", type: "Microsoft.Network/applicationGateways", service: "Networking", rg: "Network-RG", sub: "Production-Sub", baseCost: 6.5 },
  { name: "vnet-prod", type: "Microsoft.Network/virtualNetworks", service: "Networking", rg: "Network-RG", sub: "Production-Sub", baseCost: 1.2 },
  { name: "vm-dev-01", type: "Microsoft.Compute/virtualMachines", service: "Compute", rg: "Dev-RG", sub: "Development-Sub", baseCost: 3.5 },
  { name: "sql-dev", type: "Microsoft.Sql/servers", service: "Database", rg: "Dev-RG", sub: "Development-Sub", baseCost: 5.0 },
  { name: "storage-dev", type: "Microsoft.Storage/storageAccounts", service: "Storage", rg: "Dev-RG", sub: "Development-Sub", baseCost: 1.5 },
  { name: "vm-staging-01", type: "Microsoft.Compute/virtualMachines", service: "Compute", rg: "Staging-RG", sub: "Staging-Sub", baseCost: 4.0 },
  { name: "sql-staging", type: "Microsoft.Sql/servers", service: "Database", rg: "Staging-RG", sub: "Staging-Sub", baseCost: 6.0 },
  { name: "ml-workspace", type: "Microsoft.MachineLearningServices/workspaces", service: "AI + Machine Learning", rg: "ML-RG", sub: "Production-Sub", baseCost: 15.0 },
  { name: "synapse-analytics", type: "Microsoft.Synapse/workspaces", service: "Analytics", rg: "Data-RG", sub: "Production-Sub", baseCost: 10.0 },
  { name: "redis-prod", type: "Microsoft.Cache/Redis", service: "Database", rg: "Prod-RG", sub: "Production-Sub", baseCost: 7.0 },
];

function generateDailyRecords(days: number): CostRecord[] {
  const records: CostRecord[] = [];
  let id = 1;
  for (let d = 0; d < days; d++) {
    const date = format(subDays(new Date(), d), "yyyy-MM-dd");
    for (const res of resources) {
      const variance = 0.8 + Math.random() * 0.4;
      records.push({
        id: String(id++),
        usageDate: date,
        subscriptionName: res.sub,
        resourceGroup: res.rg,
        resourceName: res.name,
        resourceType: res.type,
        serviceName: res.service,
        meterCategory: res.service,
        location: locations[Math.floor(Math.random() * locations.length)],
        cost: Math.round(res.baseCost * variance * 100) / 100,
      });
    }
  }
  return records;
}

export const allRecords = generateDailyRecords(90);

export function getFilteredRecords(filters: {
  subscription?: string;
  resourceGroup?: string;
  service?: string;
  location?: string;
  dateRange?: [string, string];
}): CostRecord[] {
  return allRecords.filter((r) => {
    if (filters.subscription && filters.subscription !== "All" && r.subscriptionName !== filters.subscription) return false;
    if (filters.resourceGroup && filters.resourceGroup !== "All" && r.resourceGroup !== filters.resourceGroup) return false;
    if (filters.service && filters.service !== "All" && r.serviceName !== filters.service) return false;
    if (filters.location && filters.location !== "All" && r.location !== filters.location) return false;
    if (filters.dateRange) {
      if (r.usageDate < filters.dateRange[0] || r.usageDate > filters.dateRange[1]) return false;
    }
    return true;
  });
}

export function getSummary(records: CostRecord[], allScopeRecords?: CostRecord[]) {
  const now = new Date();
  
  // Decide which month/year to show context for based on the current selection.
  // If we have a custom range, we use the start of that range.
  const contextDate = records.length > 0 ? new Date(records[0].usageDate) : now;
  const targetMonth = format(contextDate, "yyyy-MM");
  const targetYear = format(contextDate, "yyyy");

  // For Month/Year stats, we use the records for the full scope (e.g. all days for this sub/RG)
  // rather than the specific date range the user currently has selected.
  const scopeRecords = allScopeRecords || records;

  const monthRecords = scopeRecords.filter((r) => r.usageDate.startsWith(targetMonth));
  const yearRecords = scopeRecords.filter((r) => r.usageDate.startsWith(targetYear));

  const totalCostThisMonth = monthRecords.reduce((s, r) => s + r.cost, 0);
  const totalCostThisYear = yearRecords.reduce((s, r) => s + r.cost, 0);
  
  const uniqueDays = new Set(records.map((r) => r.usageDate)).size;
  const totalCost = records.reduce((s, r) => s + r.cost, 0);
  const avgDailyCost = uniqueDays > 0 ? totalCost / uniqueDays : 0;
  const totalResources = new Set(records.map((r) => r.resourceName)).size;

  return {
    totalCostThisMonth: Math.round(totalCostThisMonth * 100) / 100,
    totalCostThisYear: Math.round(totalCostThisYear * 100) / 100,
    averageDailyCost: Math.round(avgDailyCost * 100) / 100,
    totalResources,
  };
}

export function getCostByResourceGroup(records: CostRecord[]) {
  const map = new Map<string, number>();
  records.forEach((r) => map.set(r.resourceGroup, (map.get(r.resourceGroup) || 0) + r.cost));
  return Array.from(map, ([resourceGroup, cost]) => ({ resourceGroup, cost: Math.round(cost * 100) / 100 }))
    .sort((a, b) => b.cost - a.cost);
}

export function getCostByService(records: CostRecord[]) {
  const map = new Map<string, number>();
  records.forEach((r) => map.set(r.serviceName, (map.get(r.serviceName) || 0) + r.cost));
  return Array.from(map, ([service, cost]) => ({ service, cost: Math.round(cost * 100) / 100 }))
    .sort((a, b) => b.cost - a.cost);
}

export function getDailyCost(records: CostRecord[]) {
  const map = new Map<string, number>();
  records.forEach((r) => map.set(r.usageDate, (map.get(r.usageDate) || 0) + r.cost));
  return Array.from(map, ([date, cost]) => ({ date, cost: Math.round(cost * 100) / 100 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getTopResources(records: CostRecord[], limit = 10) {
  const map = new Map<string, number>();
  records.forEach((r) => map.set(r.resourceName, (map.get(r.resourceName) || 0) + r.cost));
  return Array.from(map, ([resourceName, cost]) => ({ resourceName, cost: Math.round(cost * 100) / 100 }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, limit);
}

export function getCostBySubscription(records: CostRecord[]) {
  const map = new Map<string, number>();
  records.forEach((r) => map.set(r.subscriptionName, (map.get(r.subscriptionName) || 0) + r.cost));
  return Array.from(map, ([subscription, cost]) => ({ subscription, cost: Math.round(cost * 100) / 100 }))
    .sort((a, b) => b.cost - a.cost);
}

export function getResourceGroupDetail(records: CostRecord[], resourceGroup: string) {
  return records
    .filter((r) => r.resourceGroup === resourceGroup)
    .map((r) => ({
      resourceName: r.resourceName,
      resourceType: r.resourceType,
      serviceName: r.serviceName,
      cost: r.cost,
      usageDate: r.usageDate,
    }));
}

export const allSubscriptions = subscriptions;
export const allResourceGroups = resourceGroups;
export const allServices = services;
