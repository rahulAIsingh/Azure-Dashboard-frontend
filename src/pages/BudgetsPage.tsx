import { memo, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Target, Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { useFilteredRecords } from "@/hooks/useFilteredRecords";
import { useLookups } from "@/hooks/useLookups";
import { formatINR } from "@/lib/currency";

interface Budget {
  id: string;
  name: string;
  resourceGroup: string;
  monthlyBudget: number;
  alertAt: number;
}

const defaultBudgets: Budget[] = [
  { id: "1", name: "Production Limit", resourceGroup: "Prod-RG", monthlyBudget: 5000, alertAt: 80 },
  { id: "2", name: "Dev Limit", resourceGroup: "Dev-RG", monthlyBudget: 800, alertAt: 90 },
  { id: "3", name: "Data Limit", resourceGroup: "Data-RG", monthlyBudget: 3000, alertAt: 75 },
  { id: "4", name: "ML Budget", resourceGroup: "ML-RG", monthlyBudget: 2000, alertAt: 85 },
];

const BudgetsPage = () => {
  const { filterParams } = useDashboardFilters();
  const { data: records } = useFilteredRecords(filterParams);
  const { data: lookups } = useLookups(filterParams.subscription);
  const allResourceGroups = lookups.resourceGroups;
  const [budgets, setBudgets] = useState<Budget[]>(defaultBudgets);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newBudget, setNewBudget] = useState({ name: "", resourceGroup: "", monthlyBudget: 0, alertAt: 80 });

  const getCost = useCallback((rg: string) => {
    if (!records) return 0;
    return records.filter((r) => r.resourceGroup === rg).reduce((s, r) => s + r.cost, 0);
  }, [records]);

  const tableData = useMemo(() =>
    budgets.map((b) => {
      const currentSpend = getCost(b.resourceGroup);
      const remaining = Math.max(b.monthlyBudget - currentSpend, 0);
      const pct = b.monthlyBudget > 0 ? (currentSpend / b.monthlyBudget) * 100 : 0;
      const status = pct >= 100 ? "exceeded" : pct >= b.alertAt ? "warning" : "healthy";
      return { ...b, currentSpend, remaining, pct, status };
    }), [budgets, getCost]);

  const handleAdd = useCallback(() => {
    if (!newBudget.name || !newBudget.resourceGroup || !newBudget.monthlyBudget) return;
    setBudgets((prev) => [...prev, { ...newBudget, id: crypto.randomUUID() }]);
    setNewBudget({ name: "", resourceGroup: "", monthlyBudget: 0, alertAt: 80 });
    setDialogOpen(false);
  }, [newBudget]);

  const handleRemove = useCallback((id: string) => setBudgets((prev) => prev.filter((b) => b.id !== id)), []);

  const statusBadge = (status: string) => {
    if (status === "exceeded") return <Badge variant="destructive">Exceeded</Badge>;
    if (status === "warning") return <Badge className="bg-chart-4/20 text-chart-4 border-chart-4/30">Near Limit</Badge>;
    return <Badge className="bg-accent/20 text-accent border-accent/30">Healthy</Badge>;
  };

  const progressColor = (status: string) => {
    if (status === "exceeded") return "[&>div]:bg-destructive";
    if (status === "warning") return "[&>div]:bg-chart-4";
    return "[&>div]:bg-accent";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-chart-5/15 flex items-center justify-center">
            <Target className="h-5 w-5 text-chart-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Budget Tracking</h1>
            <p className="text-sm text-muted-foreground">Monitor spending against budget limits</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Budget</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Budget</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div><Label>Name</Label><Input value={newBudget.name} onChange={(e) => setNewBudget((p) => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Resource Group</Label>
                <Select value={newBudget.resourceGroup} onValueChange={(v) => setNewBudget((p) => ({ ...p, resourceGroup: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{allResourceGroups.map((rg) => <SelectItem key={rg} value={rg}>{rg}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Monthly Budget (₹)</Label><Input type="number" value={newBudget.monthlyBudget || ""} onChange={(e) => setNewBudget((p) => ({ ...p, monthlyBudget: Number(e.target.value) }))} /></div>
              <div><Label>Alert At (%)</Label><Input type="number" value={newBudget.alertAt} onChange={(e) => setNewBudget((p) => ({ ...p, alertAt: Number(e.target.value) }))} /></div>
              <Button className="w-full" onClick={handleAdd}>Create Budget</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Resource Group</TableHead>
              <TableHead className="text-right">Budget</TableHead>
              <TableHead className="text-right">Spent</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead className="w-40">Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium text-foreground">{row.name}</TableCell>
                <TableCell className="text-muted-foreground">{row.resourceGroup}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatINR(row.monthlyBudget)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatINR(row.currentSpend)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatINR(row.remaining)}</TableCell>
                <TableCell>
                  <Progress value={Math.min(row.pct, 100)} className={`h-2 ${progressColor(row.status)}`} />
                  <span className="text-xs text-muted-foreground">{row.pct.toFixed(0)}%</span>
                </TableCell>
                <TableCell>{statusBadge(row.status)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemove(row.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default memo(BudgetsPage);
