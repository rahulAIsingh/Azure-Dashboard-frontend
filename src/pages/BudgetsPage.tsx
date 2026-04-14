import { memo, useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Plus, Trash2, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { useFilteredRecords } from "@/hooks/useFilteredRecords";
import { useLookups } from "@/hooks/useLookups";
import { formatINR } from "@/lib/currency";
import { budgetApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface Budget {
  id: string;
  name: string;
  resourceGroup: string;
  monthlyBudget: number;
  alertAt: number;
}

const BudgetsPage = () => {
  const { filterParams } = useDashboardFilters();
  const { data: records } = useFilteredRecords(filterParams);
  const { data: lookups } = useLookups(filterParams.subscription);
  const { toast } = useToast();
  
  const allResourceGroups = lookups.resourceGroups;
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newBudget, setNewBudget] = useState({ name: "", resourceGroup: "", monthlyBudget: 0, alertAt: 80 });
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    budgetApi.getAll()
      .then(data => {
        if (mounted) setBudgets(data);
      })
      .catch(err => {
        console.error("Failed to load budgets", err);
        toast({ title: "Failed to load budgets", description: err.message, variant: "destructive" });
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => { mounted = false; };
  }, [toast]);

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

  const handleAdd = useCallback(async () => {
    if (!newBudget.name || !newBudget.resourceGroup || !newBudget.monthlyBudget) {
        toast({ title: "Validation Error", description: "Please fill in all details.", variant: "destructive" });
        return;
    }
    
    try {
        const created = await budgetApi.create(newBudget);
        setBudgets((prev) => [...prev, created]);
        setNewBudget({ name: "", resourceGroup: "", monthlyBudget: 0, alertAt: 80 });
        setDialogOpen(false);
        toast({ title: "Budget created", description: "The budget has been saved successfully." });
    } catch (err: any) {
        console.error("Failed to post budget", err);
        toast({ title: "Creation Failed", description: err.message || "Unknown error occurred.", variant: "destructive" });
    }
  }, [newBudget, toast]);

  const handleRemove = useCallback(async () => {
    if (!budgetToDelete) return;
    try {
        await budgetApi.delete(budgetToDelete.id);
        setBudgets((prev) => prev.filter((b) => b.id !== budgetToDelete.id));
        setBudgetToDelete(null);
        toast({ title: "Budget deleted", description: "The budget has been removed." });
    } catch (err: any) {
        console.error("Failed to delete budget", err);
        toast({ title: "Deletion Failed", description: err.message || "Unknown error occurred.", variant: "destructive" });
    }
  }, [budgetToDelete, toast]);

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
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={8} className="text-center py-8 text-muted-foreground italic">
                   <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 opacity-50" />
                   Loading budgets...
                 </TableCell>
               </TableRow>
             ) : tableData.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                   No budgets configured.
                 </TableCell>
               </TableRow>
             ) : tableData.map((row) => (
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
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setBudgetToDelete(row)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <AlertDialog open={!!budgetToDelete} onOpenChange={(open) => !open && setBudgetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the budget <strong>{budgetToDelete?.name}</strong>. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Budget
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </motion.div>
  );
};

export default memo(BudgetsPage);
