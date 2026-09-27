/**
 * chartColors.ts — stable, consistent color assignments for all five symbols.
 * Used by PriceChart, PerformanceBar, and DeltaChip so every component
 * referring to the same symbol uses the same color.
 */

export const SYMBOL_COLORS: Record<string, string> = {
  IBM:  '#0f62fe', // IBM blue
  MSFT: '#8a3ffc', // purple
  ORCL: '#ff832b', // orange
  SAP:  '#007d79', // teal
  CRM:  '#da1e28', // red
};

const FALLBACK = ['#6929c4', '#1192e8', '#005d5d', '#9f1853', '#570408'];

export function colorFor(symbol: string, index = 0): string {
  return SYMBOL_COLORS[symbol] ?? FALLBACK[index % FALLBACK.length];
}
