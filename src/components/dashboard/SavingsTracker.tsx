import { useMemo } from "react";
import { motion } from "framer-motion";
import { PiggyBank, TrendingDown, Target, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { CostRecord } from "@/types/dashboardTypes";
import { formatINR } from "@/lib/currency";

interface SavingsTrackerProps {
  records: CostRecord[];
}

interface SavingsGoal {
  id: string;
  title: string;
  category: string;
  targetSavings: number;
  currentSavings: number;
  icon: typeof TrendingDown;
  tip: string;
}

export function SavingsTracker({ records }: SavingsTrackerProps) {
  const goals = useMemo<SavingsGoal[]>(() => {
    const totalCost = records.reduce((s, r) => s + r.cost, 0);

    return [
      {
        id: "reserved",
        title: "Reserved Instances",
        category: "Compute",
        targetSavings: Math.round(totalCost * 0.15),
        currentSavings: Math.round(totalCost * 0.08),
        icon: Target,
        tip: "Switch 3 VMs to Reserved Instances for 1-year terms",
      },
      {
        id: "idle",
        title: "Remove Idle Resources",
        category: "All",
        targetSavings: Math.round(totalCost * 0.05),
        currentSavings: Math.round(totalCost * 0.02),
        icon: TrendingDown,
        tip: "3 resources detected as idle in Dev-RG",
      },
      {
        id: "rightsize",
        title: "Right-size VMs",
        category: "Compute",
        targetSavings: Math.round(totalCost * 0.1),
        currentSavings: Math.round(totalCost * 0.04),
        icon: ArrowRight,
        tip: "Downsize vm-prod-api-01 from D4 to D2 series",
      },
      {
        id: "storage",
        title: "Storage Tiering",
        category: "Storage",
        targetSavings: Math.round(totalCost * 0.03),
        currentSavings: Math.round(totalCost * 0.015),
        icon: PiggyBank,
        tip: "Move cold data to Archive tier",
      },
    ];
  }, [records]);

  const totalTarget = goals.reduce((s, g) => s + g.targetSavings, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.currentSavings, 0);
  const overallPercent = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-elevated p-4 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <PiggyBank className="h-5 w-5 text-accent" />
        <h3 className="font-semibold text-foreground text-sm sm:text-base">Savings Tracker</h3>
      </div>

      {/* Overall progress */}
      <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Overall Progress</span>
          <span className="text-sm font-bold text-accent">{overallPercent}%</span>
        </div>
        <Progress value={overallPercent} className="h-2.5 mb-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Saved: <span className="font-semibold text-foreground">{formatINR(totalCurrent, 0)}</span></span>
          <span>Target: <span className="font-semibold text-foreground">{formatINR(totalTarget, 0)}</span></span>
        </div>
      </div>

      {/* Individual goals */}
      <div className="space-y-3">
        {goals.map((goal) => {
          const percent = goal.targetSavings > 0 ? Math.round((goal.currentSavings / goal.targetSavings) * 100) : 0;
          const Icon = goal.icon;
          return (
            <div key={goal.id} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs sm:text-sm font-medium text-foreground">{goal.title}</span>
                    <span className="text-xs font-bold text-foreground">{percent}%</span>
                  </div>
                  <Progress value={percent} className="h-1.5 mb-1.5" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{goal.tip}</p>
                  <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                    <span>{formatINR(goal.currentSavings, 0)} saved</span>
                    <span>{formatINR(goal.targetSavings, 0)} target</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
