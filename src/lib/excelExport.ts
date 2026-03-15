import * as XLSX from "xlsx";
import type { CostRecord } from "@/types/dashboardTypes";

export function exportToExcel(records: CostRecord[], filename: string = "azure-cost-export") {
  const data = records.map((r) => ({
    UsageDate: r.usageDate,
    Subscription: r.subscriptionName,
    ResourceGroup: r.resourceGroup,
    ResourceName: r.resourceName,
    ResourceType: r.resourceType,
    ServiceName: r.serviceName,
    Location: r.location,
    Cost: r.cost,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cost Data");
  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
