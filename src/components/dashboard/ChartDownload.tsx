import { useCallback, useRef } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChartDownloadProps {
  chartId: string;
  title?: string;
}

export function ChartDownload({ chartId, title = "chart" }: ChartDownloadProps) {
  const downloadAs = useCallback((format: "png" | "svg") => {
    const container = document.getElementById(chartId);
    if (!container) return;

    const svg = container.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const filename = `${title}-${new Date().toISOString().slice(0, 10)}`;

    if (format === "svg") {
      const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.svg`;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    // PNG export via canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.scale(2, 2);
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `${filename}.png`;
      link.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [chartId, title]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100">
          <Camera className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => downloadAs("png")}>Download PNG</DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadAs("svg")}>Download SVG</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
