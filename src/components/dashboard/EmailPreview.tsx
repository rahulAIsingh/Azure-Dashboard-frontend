import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, Send, Eye, AlertTriangle, TrendingUp, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { BudgetAlert } from "./BudgetAlerts";

interface EmailPreviewProps {
  budget: BudgetAlert;
  spent: number;
  projected?: number;
  lastMonth?: number;
}

export function EmailPreviewButton({ budget, spent, projected, lastMonth }: EmailPreviewProps) {
  const [open, setOpen] = useState(false);
  const pct = Math.round((spent / budget.budget) * 100);
  const isOver = pct >= 100;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-[10px] px-2 gap-1 text-muted-foreground hover:text-foreground"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
      >
        <Mail className="h-3 w-3" />
        Preview Email
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Email Alert Preview
            </DialogTitle>
          </DialogHeader>

          {/* Email envelope */}
          <div className="space-y-3 mt-2">
            <div className="text-xs space-y-1.5 p-3 rounded-md bg-secondary/50 border border-border/50">
              <div className="flex gap-2"><span className="text-muted-foreground w-12">From:</span><span className="text-foreground">Azure Cost Intel &lt;alerts@azurecostintel.com&gt;</span></div>
              <div className="flex gap-2"><span className="text-muted-foreground w-12">To:</span><span className="text-foreground">admin@company.com</span></div>
              <div className="flex gap-2"><span className="text-muted-foreground w-12">Subject:</span><span className="text-foreground font-semibold">⚠️ Budget Alert: {budget.name} — {pct}% Utilization</span></div>
              <div className="flex gap-2"><span className="text-muted-foreground w-12">Date:</span><span className="text-foreground">{dateStr} at {timeStr}</span></div>
            </div>

            {/* Email body */}
            <div className="border border-border rounded-lg overflow-hidden">
              {/* Header banner */}
              <div className={`px-6 py-4 ${isOver ? "bg-destructive/10" : "bg-chart-4/10"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={`h-5 w-5 ${isOver ? "text-destructive" : "text-chart-4"}`} />
                  <h3 className={`text-lg font-bold ${isOver ? "text-destructive" : "text-chart-4"}`}>
                    {isOver ? "Budget Exceeded" : "Budget Threshold Reached"}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your budget "{budget.name}" has reached {pct}% of the configured limit.
                </p>
              </div>

              {/* Body content */}
              <div className="p-6 space-y-5 bg-card">
                {/* Budget summary */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">Budget Summary</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-md bg-secondary/30 border border-border/30">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Budget Name</p>
                      <p className="text-sm font-semibold text-foreground">{budget.name}</p>
                    </div>
                    <div className="p-3 rounded-md bg-secondary/30 border border-border/30">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Scope</p>
                      <p className="text-sm font-semibold text-foreground">{budget.scopeValue}</p>
                    </div>
                    <div className="p-3 rounded-md bg-secondary/30 border border-border/30">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Current Spend</p>
                      <p className={`text-sm font-bold ${isOver ? "text-destructive" : "text-foreground"}`}>
                        ${spent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-3 rounded-md bg-secondary/30 border border-border/30">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Budget Limit</p>
                      <p className="text-sm font-bold text-foreground">
                        ${budget.budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Budget Utilization</span>
                    <span className={isOver ? "text-destructive font-semibold" : ""}>{pct}%</span>
                  </div>
                  <div className="h-4 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isOver ? "bg-destructive" : pct >= budget.alertAt ? "bg-chart-4" : "bg-primary"}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>$0</span>
                    <span className="text-chart-4">Alert at {budget.alertAt}%</span>
                    <span>${budget.budget.toLocaleString()}</span>
                  </div>
                </div>

                {/* Projections */}
                {projected && (
                  <div className="p-3 rounded-md border border-border/50 bg-secondary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold text-foreground">Cost Projection</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Projected Monthly</p>
                        <p className={`text-sm font-bold ${projected > budget.budget ? "text-destructive" : "text-foreground"}`}>
                          ${projected.toLocaleString()}
                        </p>
                      </div>
                      {lastMonth !== undefined && (
                        <div>
                          <p className="text-[10px] text-muted-foreground">Last Month</p>
                          <p className="text-sm font-bold text-foreground">${lastMonth.toLocaleString()}</p>
                        </div>
                      )}
                      {lastMonth !== undefined && lastMonth > 0 && (
                        <div>
                          <p className="text-[10px] text-muted-foreground">MoM Change</p>
                          <p className={`text-sm font-bold ${projected > lastMonth ? "text-destructive" : "text-kpi-up"}`}>
                            {projected > lastMonth ? "+" : ""}{Math.round(((projected - lastMonth) / lastMonth) * 100)}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action items */}
                <div className="p-3 rounded-md border border-primary/20 bg-primary/5">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Recommended Actions</h4>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      Review resource usage in the "{budget.scopeValue}" {budget.scope}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      Check for idle or underutilized resources that can be scaled down
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      Consider Reserved Instances for predictable workloads
                    </li>
                    {isOver && (
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-0.5">•</span>
                        <span className="text-destructive">Immediate attention required — budget has been exceeded</span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-border/50 text-center">
                  <p className="text-[10px] text-muted-foreground">
                    This is an automated alert from Azure Cost Intelligence Dashboard.<br />
                    Manage alert preferences in Settings → Budget Alerts.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Badge variant="outline" className="text-[10px] gap-1 py-1">
                <Eye className="h-3 w-3" /> Preview Only
              </Badge>
              <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setOpen(false)}>
                <Send className="h-3 w-3" /> Send Test Email (Simulated)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
