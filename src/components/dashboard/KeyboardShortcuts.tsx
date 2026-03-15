import { useState, useEffect } from "react";
import { Keyboard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const shortcuts = [
  { keys: ["⌘", "K"], description: "Open global search" },
  { keys: ["⌘", "E"], description: "Export data to CSV" },
  { keys: ["⌘", "D"], description: "Toggle dark mode" },
  { keys: ["⌘", "1"], description: "Go to Overview tab" },
  { keys: ["⌘", "2"], description: "Go to Analytics tab" },
  { keys: ["⌘", "3"], description: "Go to Forecast tab" },
  { keys: ["⌘", "4"], description: "Go to Alerts tab" },
  { keys: ["⌘", "5"], description: "Go to Optimize tab" },
  { keys: ["Esc"], description: "Close dialogs / Go back" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
];

interface KeyboardShortcutsProps {
  onToggleTheme?: () => void;
  onExport?: () => void;
  onOpenSearch?: () => void;
  onTabChange?: (tab: string) => void;
}

export function KeyboardShortcuts({ onToggleTheme, onExport, onOpenSearch, onTabChange }: KeyboardShortcutsProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ? for shortcuts help
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen(true);
      }

      // Cmd/Ctrl shortcuts
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "k":
            e.preventDefault();
            onOpenSearch?.();
            break;
          case "e":
            e.preventDefault();
            onExport?.();
            break;
          case "d":
            e.preventDefault();
            onToggleTheme?.();
            break;
          case "1":
            e.preventDefault();
            onTabChange?.("overview");
            break;
          case "2":
            e.preventDefault();
            onTabChange?.("analytics");
            break;
          case "3":
            e.preventDefault();
            onTabChange?.("forecast");
            break;
          case "4":
            e.preventDefault();
            onTabChange?.("alerts");
            break;
          case "5":
            e.preventDefault();
            onTabChange?.("optimize");
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onToggleTheme, onExport, onOpenSearch, onTabChange]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(true)}>
            <Keyboard className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Keyboard shortcuts (?)</p>
        </TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {shortcuts.map((shortcut, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-sm text-foreground">{shortcut.description}</span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, j) => (
                    <kbd key={j} className="px-2 py-1 rounded bg-muted text-xs font-mono text-muted-foreground">
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
