import { useState, useEffect, useCallback } from "react";
import { X, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { onApiError } from "@/services/apiClient";
import { motion, AnimatePresence } from "framer-motion";

export function GlobalErrorBanner() {
  const [error, setError] = useState<{ message: string; timestamp: number } | null>(null);

  useEffect(() => {
    const unsubscribe = onApiError((err) => {
      setError({ message: err.message, timestamp: Date.now() });
    });
    return () => { unsubscribe(); };
  }, []);

  const dismiss = useCallback(() => setError(null), []);
  const retry = useCallback(() => {
    setError(null);
    window.location.reload();
  }, []);

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-destructive/10 border-b border-destructive/20 overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-2 max-w-screen-xl mx-auto">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive flex-1 truncate">{error.message}</p>
            <Button variant="ghost" size="sm" onClick={retry} className="text-destructive h-7 gap-1 text-xs">
              <RefreshCw className="h-3 w-3" />Retry
            </Button>
            <Button variant="ghost" size="icon" onClick={dismiss} className="text-destructive h-7 w-7">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
