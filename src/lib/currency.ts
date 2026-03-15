/**
 * Format a number as Indian Rupees (INR).
 * Examples:
 *   formatINR(1234.56)       → "₹1,234.56"
 *   formatINR(1234.56, 0)    → "₹1,235"
 *   formatINR(4940, 0)       → "₹4,940"
 */
export function formatINR(value: number, decimals: number = 2): string {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

/**
 * Short format for axis labels: ₹1.2k, ₹15k etc.
 */
export function formatINRShort(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
  return `₹${value.toFixed(0)}`;
}

/**
 * Axis tick formatter
 */
export function inrAxisFormatter(v: number): string {
  return `₹${v}`;
}

/**
 * Tooltip formatter for Recharts
 */
export function inrTooltipFormatter(value: number, label: string = "Cost"): [string, string] {
  return [formatINR(value), label];
}
