import { useIsFetching } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function NetworkActivityIndicator() {
  const isFetching = useIsFetching();

  return (
    <AnimatePresence>
      {isFetching > 0 && (
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          exit={{ opacity: 0, width: 0 }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground overflow-hidden"
        >
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span className="hidden sm:inline whitespace-nowrap">Syncing…</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
