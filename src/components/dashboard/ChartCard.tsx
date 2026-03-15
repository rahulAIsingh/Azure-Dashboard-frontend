import { ReactNode, useId } from "react";
import { motion } from "framer-motion";
import { ChartDownload } from "@/components/dashboard/ChartDownload";

interface ChartCardProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  title?: string;
  downloadable?: boolean;
}

export function ChartCard({ children, delay = 0, className = "", title, downloadable = true }: ChartCardProps) {
  const id = useId().replace(/:/g, "");
  const chartId = `chart-${id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -3, transition: { duration: 0.25, ease: "easeOut" } }}
      className={`chart-gradient-border chart-card-animate ${className}`}
    >
      <div id={chartId} className="glass-card-elevated p-4 sm:p-5 relative">
        {downloadable && (
          <div className="absolute top-2 right-2 z-10">
            <ChartDownload chartId={chartId} title={title || "chart"} />
          </div>
        )}
        {children}
      </div>
    </motion.div>
  );
}
