/**
 * viewUtils.ts — pure data transformation functions shared across views.
 *
 * Extracted from view components so they can be unit-tested independently
 * of React rendering. No imports from React or Recharts here.
 */

import type { HistoricalDataPoint } from '@/types/finance';

// ─── WeekView helpers ─────────────────────────────────────────────────────────

/**
 * Returns the first and last close price from a history array.
 * Returns null when the array is empty.
 */
export function periodBounds(
  history: Pick<HistoricalDataPoint, 'close' | 'date'>[],
): { first: number; last: number } | null {
  if (history.length === 0) return null;
  return { first: history[0].close, last: history[history.length - 1].close };
}

/**
 * Computes the percentage return between two prices.
 * Returns null when startPrice is 0 to avoid division by zero.
 */
export function periodReturnPct(startPrice: number, endPrice: number): number | null {
  if (startPrice === 0) return null;
  return ((endPrice - startPrice) / startPrice) * 100;
}

// ─── QuarterView helpers ──────────────────────────────────────────────────────

export interface PeriodStats {
  symbol: string;
  startPrice: number;
  endPrice: number;
  returnPct: number;
  high: number;
  low: number;
}

/**
 * Computes period stats (start/end/high/low/return) for each symbol
 * that has at least 2 data points. Sorted descending by return.
 */
export function computePeriodStats(
  symbols: string[],
  data: Record<string, { history: Pick<HistoricalDataPoint, 'close' | 'high' | 'low' | 'date'>[] }>,
): PeriodStats[] {
  return symbols
    .filter((s) => (data[s]?.history?.length ?? 0) >= 2)
    .map((s) => {
      const h = data[s].history;
      const startPrice = h[0].close;
      const endPrice   = h[h.length - 1].close;
      const returnPct  = periodReturnPct(startPrice, endPrice) ?? 0;
      const high       = Math.max(...h.map((p) => p.high));
      const low        = Math.min(...h.map((p) => p.low));
      return { symbol: s, startPrice, endPrice, returnPct, high, low };
    })
    .sort((a, b) => b.returnPct - a.returnPct);
}

// ─── DayView helpers ──────────────────────────────────────────────────────────

/**
 * Formats an ISO-8601 timestamp string as a short time label.
 * e.g. "2025-07-01T14:32:00.000Z" → "2:32 PM"
 */
export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// ─── CompanyCard helpers ──────────────────────────────────────────────────────

/**
 * Formats a market cap number into a human-readable string.
 * e.g. 167_000_000_000 → "$167.0B"
 */
export function formatMarketCap(mc: number): string {
  if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
  if (mc >= 1e9)  return `$${(mc / 1e9).toFixed(1)}B`;
  return `$${(mc / 1e6).toFixed(0)}M`;
}
