export function getChartTheme() {
  const style = getComputedStyle(document.documentElement);
  const get = (v: string) => style.getPropertyValue(v).trim();

  return {
    grid: `hsl(${get("--chart-grid")})`,
    text: `hsl(${get("--chart-text")})`,
    tooltipBg: `hsl(${get("--tooltip-bg")})`,
    tooltipBorder: `hsl(${get("--tooltip-border")})`,
    tooltipText: `hsl(${get("--tooltip-text")})`,
  };
}

export const CHART_COLORS = [
  "hsl(200, 95%, 50%)",   // Vivid blue
  "hsl(170, 70%, 42%)",   // Teal
  "hsl(260, 62%, 58%)",   // Purple
  "hsl(36, 92%, 52%)",    // Amber
  "hsl(352, 72%, 55%)",   // Rose
  "hsl(285, 62%, 56%)",   // Violet
  "hsl(140, 60%, 45%)",   // Green
  "hsl(20, 85%, 55%)",    // Orange
];

export const CHART_GRADIENTS = {
  primary: { start: "hsl(200, 95%, 50%)", end: "hsl(200, 95%, 50%)" },
  accent: { start: "hsl(170, 70%, 42%)", end: "hsl(170, 70%, 42%)" },
  purple: { start: "hsl(260, 62%, 58%)", end: "hsl(260, 62%, 58%)" },
};

export const tooltipStyle = (ct: ReturnType<typeof getChartTheme>) => ({
  backgroundColor: ct.tooltipBg,
  border: `1px solid ${ct.tooltipBorder}`,
  borderRadius: 10,
  color: ct.tooltipText,
  padding: "10px 14px",
  fontWeight: 500,
  fontSize: 13,
  boxShadow: "0 8px 24px -8px rgba(0,0,0,0.12)",
});
