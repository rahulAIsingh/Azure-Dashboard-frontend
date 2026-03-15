import type { CostRecord } from "@/types/dashboardTypes";

export function exportToCsv(records: CostRecord[], filename: string = "azure-cost-export") {
  const headers = ["UsageDate", "Subscription", "ResourceGroup", "ResourceName", "ResourceType", "ServiceName", "Location", "Cost"];
  const rows = records.map((r) =>
    [r.usageDate, r.subscriptionName, r.resourceGroup, r.resourceName, r.resourceType, r.serviceName, r.location, r.cost.toFixed(2)].join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
