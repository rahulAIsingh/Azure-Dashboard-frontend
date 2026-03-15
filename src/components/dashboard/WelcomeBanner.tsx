import { motion } from "framer-motion";
import { format } from "date-fns";
import { Sparkles, Download, BarChart3, Bell, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/currency";

interface WelcomeBannerProps {
  userName: string;
  totalCostThisMonth: number;
  onNavigate: (section: string) => void;
  onExport: () => void;
}

export function WelcomeBanner({ userName, totalCostThisMonth, onNavigate, onExport }: WelcomeBannerProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-border/30"
    >
      {/* Multi-layer gradient background */}
      <div className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, transparent 50%),
            linear-gradient(225deg, hsl(var(--accent) / 0.08) 0%, transparent 50%),
            linear-gradient(315deg, hsl(var(--chart-3) / 0.06) 0%, transparent 50%),
            hsl(var(--card))
          `,
        }}
      />

      {/* Animated floating orbs */}
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full float-animation"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.12), transparent 65%)" }}
      />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full float-animation"
        style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.1), transparent 65%)", animationDelay: "-3s" }}
      />
      <div className="absolute top-1/2 right-1/3 w-24 h-24 rounded-full float-animation opacity-50"
        style={{ background: "radial-gradient(circle, hsl(var(--chart-3) / 0.08), transparent 65%)", animationDelay: "-1.5s" }}
      />

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.015]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
      />

      <div className="relative p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          {/* Greeting */}
          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex items-center gap-2"
            >
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">{today}</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight"
            >
              {greeting}, <span className="gradient-text">{userName}</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-sm text-muted-foreground max-w-lg leading-relaxed"
            >
              Your cloud spend this month is{" "}
              <span className="font-bold text-foreground tabular-nums">
                {formatINR(totalCostThisMonth)}
              </span>
              . Here's what needs your attention today.
            </motion.p>
          </div>

          {/* Quick action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex flex-wrap gap-2"
          >
            {[
              { label: "Analytics", icon: BarChart3, section: "analytics" },
              { label: "Alerts", icon: Bell, section: "alerts" },
              { label: "Optimize", icon: Zap, section: "optimize" },
            ].map((action) => (
              <Button
                key={action.section}
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8 bg-card/50 backdrop-blur-sm border-border/40 hover:bg-card/80 hover:border-primary/30 hover:shadow-sm transition-all duration-250 group"
                onClick={() => onNavigate(action.section)}
              >
                <action.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                {action.label}
                <ArrowRight className="h-3 w-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-8 bg-card/50 backdrop-blur-sm border-border/40 hover:bg-card/80 hover:border-primary/30 hover:shadow-sm transition-all duration-250 group"
              onClick={onExport}
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              Export
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
