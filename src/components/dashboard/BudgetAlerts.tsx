import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Plus, Trash2, Bell, BellOff, TrendingUp, TrendingDown, ChevronDown, ChevronRight, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { useLookups } from "@/hooks/useLookups";
import type { CostRecord } from "@/data/mockData";
import { formatINR } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { startOfMonth, subMonths, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import { EmailPreviewButton } from "./EmailPreview";

export interface BudgetAlert {
  id: string;
  name: string;
  scope: string;
  scopeValue: string;
  budget: number;
  alertAt: number;
}

interface BudgetAlertsProps {
  budgets: BudgetAlert[];
  onAddBudget: (b: BudgetAlert) => void;
  onRemoveBudget: (id: string) => void;
  getCostForScope: (scope: string, value: string) => number;
  records: CostRecord[];
}

interface ProjectedCost {
  scopeValue: string;
  scope: string;
  currentSpend: number;
  projected: number;
  lastMonth: number;
  change: number;
  daysElapsed: number;
}

export function BudgetAlerts({ budgets, onAddBudget, onRemoveBudget, getCostForScope, records }: BudgetAlertsProps) {
  const [open, setOpen] = useState(false);
  const [expandedBudget, setExpandedBudget] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [scope, setScope] = useState("subscription");
  const [scopeValue, setScopeValue] = useState("");
  const [budget, setBudget] = useState("");
  const [alertAt, setAlertAt] = useState("80");
  const { filterParams } = useDashboardFilters();
  const { toast } = useToast();

  const handleAdd = () => {
    if (!name || !scopeValue || !budget) return;
    onAddBudget({
      id: crypto.randomUUID(),
      name,
      scope,
      scopeValue,
      budget: parseFloat(budget),
      alertAt: parseInt(alertAt),
    });
    setName(""); setScopeValue(""); setBudget(""); setAlertAt("80");
    setOpen(false);
  };

  // Compute projected monthly costs for all resource groups
  const projectedCosts = useMemo((): ProjectedCost[] => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const daysElapsed = Math.max(1, Math.ceil((now.getTime() - thisMonthStart.getTime()) / 86400000));

    const rgMap = new Map<string, { thisMonth: number; lastMonth: number }>();
    records.forEach((r) => {
      const d = parseISO(r.usageDate);
      const key = r.resourceGroup;
      if (!rgMap.has(key)) rgMap.set(key, { thisMonth: 0, lastMonth: 0 });
      const entry = rgMap.get(key)!;
      if (d >= thisMonthStart) entry.thisMonth += r.cost;
      else if (isWithinInterval(d, { start: lastMonthStart, end: lastMonthEnd })) entry.lastMonth += r.cost;
    });

    return Array.from(rgMap.entries()).map(([scopeValue, costs]) => {
      const projected = (costs.thisMonth / daysElapsed) * 30;
      const change = costs.lastMonth > 0 ? ((projected - costs.lastMonth) / costs.lastMonth) * 100 : 0;
      return {
        scopeValue,
        scope: "resourceGroup",
        currentSpend: Math.round(costs.thisMonth * 100) / 100,
        projected: Math.round(projected * 100) / 100,
        lastMonth: Math.round(costs.lastMonth * 100) / 100,
        change: Math.round(change * 10) / 10,
        daysElapsed,
      };
    }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }, [records]);

  // Auto-detect budget breaches and notify
  const breachedBudgets = useMemo(() => {
    return budgets.filter((b) => {
      const spent = getCostForScope(b.scope, b.scopeValue);
      const pct = (spent / b.budget) * 100;
      return pct >= b.alertAt;
    });
  }, [budgets, getCostForScope]);

  // Toast on breach (only once per render cycle)
  const [notified, setNotified] = useState<Set<string>>(new Set());
  useEffect(() => {
    breachedBudgets.forEach((b) => {
      if (!notified.has(b.id)) {
        const spent = getCostForScope(b.scope, b.scopeValue);
        const pct = Math.round((spent / b.budget) * 100);
        toast({
          title: `⚠️ Budget Alert: ${b.name}`,
          description: `${b.scopeValue} has reached ${pct}% of ₹${b.budget.toLocaleString()} budget.`,
          variant: "destructive",
        });
        setNotified((prev) => new Set(prev).add(b.id));
      }
    });
  }, [breachedBudgets, getCostForScope, toast, notified]);

  // Auto-suggested budgets for RGs with high projected growth
  const autoSuggestions = useMemo(() => {
    const existingScopes = new Set(budgets.filter((b) => b.scope === "resourceGroup").map((b) => b.scopeValue));
    return projectedCosts
      .filter((p) => p.change > 15 && !existingScopes.has(p.scopeValue))
      .slice(0, 3);
  }, [projectedCosts, budgets]);

  const { data: lookups } = useLookups(filterParams.subscription);
  const allResourceGroups = lookups.resourceGroups || [];
  const allSubscriptions = lookups.subscriptions || [];

  const scopeOptions = scope === "subscription" ? allSubscriptions : allResourceGroups;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-muted-foreground">Budget Alerts</h3>
          {breachedBudgets.length > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{breachedBudgets.length} breached</Badge>
          )}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="h-3 w-3" /> Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Create Budget Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <Input placeholder="Budget name" value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border" />
              <Select value={scope} onValueChange={(v) => { setScope(v); setScopeValue(""); }}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="resourceGroup">Resource Group</SelectItem>
                </SelectContent>
              </Select>
              <Select value={scopeValue} onValueChange={setScopeValue}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select scope" /></SelectTrigger>
                <SelectContent>
                  {scopeOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Budget (₹)" value={budget} onChange={(e) => setBudget(e.target.value)} className="bg-secondary border-border" />
                <Input type="number" placeholder="Alert at (%)" value={alertAt} onChange={(e) => setAlertAt(e.target.value)} className="bg-secondary border-border" />
              </div>
              <Button onClick={handleAdd} className="w-full">Create Alert</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Auto-suggestions for high-growth RGs */}
      {autoSuggestions.length > 0 && (
        <div className="mb-4 p-3 rounded-md border border-chart-4/30 bg-chart-4/5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-3.5 w-3.5 text-chart-4" />
            <span className="text-xs font-medium text-chart-4">Suggested Budgets</span>
          </div>
          <div className="space-y-2">
            {autoSuggestions.map((s) => (
              <div key={s.scopeValue} className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-foreground font-medium">{s.scopeValue}</span>
                  <span className="text-destructive ml-2">+{s.change}% projected growth</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={() => {
                    onAddBudget({
                      id: crypto.randomUUID(),
                      name: `${s.scopeValue} Auto-Budget`,
                      scope: "resourceGroup",
                      scopeValue: s.scopeValue,
                      budget: Math.round(s.projected * 1.1),
                      alertAt: 80,
                    });
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <BellOff className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No budget alerts configured</p>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => {
            const spent = getCostForScope(b.scope, b.scopeValue);
            const pct = Math.min((spent / b.budget) * 100, 100);
            const isOver = pct >= b.alertAt;
            const isCritical = pct >= 100;
            const isExpanded = expandedBudget === b.id;

            // Find projected data for this budget
            const projection = projectedCosts.find((p) => p.scopeValue === b.scopeValue);
            const projectedPct = projection ? Math.min((projection.projected / b.budget) * 100, 150) : null;
            const willExceed = projectedPct !== null && projectedPct > 100;

            return (
              <div key={b.id}>
                <div
                  className={`p-3 rounded-md border cursor-pointer transition-colors ${isCritical ? "border-destructive/50 bg-destructive/5 hover:bg-destructive/10"
                    : isOver ? "border-chart-4/50 bg-chart-4/5 hover:bg-chart-4/10"
                      : "border-border/50 bg-secondary/30 hover:bg-secondary/40"
                    }`}
                  onClick={() => setExpandedBudget(isExpanded ? null : b.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                      {(isOver || isCritical) && <AlertTriangle className={`h-3.5 w-3.5 ${isCritical ? "text-destructive" : "text-chart-4"}`} />}
                      <span className="text-sm font-medium text-foreground">{b.name}</span>
                      {willExceed && !isCritical && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-destructive/40 text-destructive">
                          Will exceed
                        </Badge>
                      )}
                    </div>
                    <EmailPreviewButton
                      budget={b}
                      spent={spent}
                      projected={projection?.projected}
                      lastMonth={projection?.lastMonth}
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onRemoveBudget(b.id); }}>
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 ml-5">{b.scopeValue} · Alert at {b.alertAt}%</p>
                  <div className="ml-5">
                    <Progress value={pct} className={`h-2 ${isCritical ? "[&>div]:bg-destructive" : isOver ? "[&>div]:bg-chart-4" : "[&>div]:bg-primary"}`} />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">₹{spent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span className="text-xs text-muted-foreground">₹{b.budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && projection && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mx-2 mb-1 p-3 rounded-b-md bg-secondary/20 border border-t-0 border-border/20 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 rounded-md bg-background/50">
                            <p className="text-xs text-muted-foreground">Last Month</p>
                            <p className="text-sm font-bold text-foreground">₹{projection.lastMonth.toLocaleString()}</p>
                          </div>
                          <div className="text-center p-2 rounded-md bg-background/50">
                            <p className="text-xs text-muted-foreground">Projected</p>
                            <p className={`text-sm font-bold ${willExceed ? "text-destructive" : "text-foreground"}`}>₹{projection.projected.toLocaleString()}</p>
                          </div>
                          <div className="text-center p-2 rounded-md bg-background/50">
                            <p className="text-xs text-muted-foreground">MoM Change</p>
                            <div className="flex items-center justify-center gap-1">
                              {projection.change > 0 ? (
                                <TrendingUp className="h-3 w-3 text-destructive" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-kpi-up" />
                              )}
                              <p className={`text-sm font-bold ${projection.change > 0 ? "text-destructive" : "text-kpi-up"}`}>
                                {projection.change > 0 ? "+" : ""}{projection.change}%
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Projected vs budget bar */}
                        <div>
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>Projected spend vs budget</span>
                            <span>{projectedPct !== null ? Math.round(projectedPct) : 0}%</span>
                          </div>
                          <div className="h-3 rounded-full bg-secondary overflow-hidden relative">
                            <div
                              className={`h-full rounded-full transition-all ${willExceed ? "bg-destructive" : "bg-primary"}`}
                              style={{ width: `${Math.min(projectedPct || 0, 100)}%` }}
                            />
                            {willExceed && (
                              <div className="absolute right-0 top-0 h-full w-1 bg-destructive animate-pulse" />
                            )}
                          </div>
                        </div>

                        <p className="text-[10px] text-muted-foreground">
                          Based on {projection.daysElapsed} days of data · Actual: {formatINR(projection.currentSpend)}{" "}
                          {willExceed && "· ⚠️ Projected to exceed budget by " + formatINR(projection.projected - b.budget)}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
