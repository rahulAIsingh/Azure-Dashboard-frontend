import { useState, useCallback } from "react";
import { RefreshCw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const intervals = [
  { label: "Off", value: "0" },
  { label: "30s", value: "30000" },
  { label: "60s", value: "60000" },
  { label: "5m", value: "300000" },
];

interface AutoRefreshProps {
  value: number;
  onChange: (ms: number) => void;
}

export function AutoRefreshToggle({ value, onChange }: AutoRefreshProps) {
  const current = intervals.find((i) => i.value === String(value)) || intervals[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground">
          <Timer className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{value > 0 ? current.label : "Auto"}</span>
          {value > 0 && <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={String(value)} onValueChange={(v) => onChange(Number(v))}>
          {intervals.map((i) => (
            <DropdownMenuRadioItem key={i.value} value={i.value}>{i.label}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
