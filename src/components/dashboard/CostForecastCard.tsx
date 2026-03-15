import { useMemo } from "react";
import { TrendingUp, Calendar } from "lucide-react";
import { formatINR } from "@/lib/currency";
import { Progress } from "@/components/ui/progress";

interface CostForecastCardProps {
  averageDailyCost: number;
  totalCostThisMonth: number;
}

export function CostForecastCard({ averageDailyCost, totalCostThisMonth }: CostForecastCardProps) {
  const forecast = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();
    const remaining = daysInMonth - daysPassed;
    const projected = totalCostThisMonth + averageDailyCost * remaining;
    const pct = daysInMonth > 0 ? (daysPassed / daysInMonth) * 100 : 0;
    return { projected, remaining, daysPassed, daysInMonth, pct };
  }, [averageDailyCost, totalCostThisMonth]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Cost Forecast</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Current Spend</p>
          <p className="text-lg font-bold font-mono text-foreground">{formatINR(totalCostThisMonth)}</p>
          <p className="text-xs text-muted-foreground">{forecast.daysPassed} days elapsed</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Projected End of Month</p>
          <p className="text-lg font-bold font-mono text-primary">{formatINR(forecast.projected)}</p>
          <p className="text-xs text-muted-foreground">{forecast.remaining} days remaining</p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Month Progress</span>
          <span>{forecast.pct.toFixed(0)}%</span>
        </div>
        <Progress value={forecast.pct} className="h-2" />
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        Based on {formatINR(averageDailyCost)} avg daily cost
      </p>
    </div>
  );
}
