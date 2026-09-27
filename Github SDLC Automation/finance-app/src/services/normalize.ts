/**
 * normalize.ts — shared normalization and validation functions for finance data.
 *
 * All adapters (Yahoo, mock, future sources) funnel raw API responses through
 * these functions before returning data to the store.  This means:
 *
 *   - The UI only ever sees the QuoteSummary / HistoricalDataPoint shape.
 *   - Invalid or missing fields are coerced to safe defaults, never NaN/null.
 *   - Adding a new data source only requires a mapping → normalizeQuote call.
 *
 * None of these functions perform I/O — they are pure and fully unit-testable.
 */

import type { QuoteSummary, HistoricalDataPoint } from '@/types/finance';
import { FinanceError } from '@/types/finance';
import { getDisplayName } from './companyRegistry';

// ─── Number coercion helpers ───────────────────────────────────────────────────

/** Converts a value to a finite number, returning `fallback` for anything invalid. */
function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Rounds a number to `decimals` decimal places. */
function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// ─── Quote normalization ───────────────────────────────────────────────────────

/**
 * Raw shape accepted by normalizeQuote.
 *
 * All fields are `unknown` — the function validates and coerces each one.
 * Map any API response (Yahoo Finance, mock, or future source) to this shape
 * before calling normalizeQuote.
 */
export interface RawQuote {
  symbol?: unknown;
  name?: unknown;
  price?: unknown;
  change?: unknown;
  /** Decimal fraction, e.g. 0.0068 for 0.68%. Will be multiplied by 100. */
  changePercent?: unknown;
  previousClose?: unknown;
  dayHigh?: unknown;
  dayLow?: unknown;
  fiftyTwoWeekHigh?: unknown;
  fiftyTwoWeekLow?: unknown;
  /** Raw P/E ratio */
  peRatio?: unknown;
  volume?: unknown;
  marketCap?: unknown;
  currency?: unknown;
  marketState?: unknown;
}

/**
 * Normalizes a raw API quote response into a validated QuoteSummary.
 *
 * - All numeric fields are coerced to finite numbers (default 0).
 * - `changePercent` is expected as a decimal fraction (0.0068) and converted
 *   to a percentage (0.68). If the value is already > 1 it is used as-is.
 * - `name` falls back to the registry display name, then the raw symbol.
 * - `marketState` is validated against known values; unknown states become 'CLOSED'.
 * - Throws `FinanceError('INVALID_RESPONSE')` if `symbol` is missing or blank.
 */
export function normalizeQuote(raw: RawQuote): QuoteSummary {
  const symbol = String(raw.symbol ?? '').trim().toUpperCase();
  if (!symbol) {
    throw new FinanceError('INVALID_RESPONSE', 'Quote response is missing a symbol.');
  }

  const rawChangePercent = toNumber(raw.changePercent);
  // Yahoo Finance returns changePercent as a decimal fraction (e.g. 0.0068).
  // Values between -1 and 1 are treated as fractions and multiplied by 100.
  const changePercent =
    rawChangePercent > -1 && rawChangePercent < 1
      ? round(rawChangePercent * 100)
      : round(rawChangePercent);

  const validMarketStates = new Set(['REGULAR', 'PRE', 'POST', 'CLOSED']);
  const rawState = String(raw.marketState ?? '').toUpperCase();
  const marketState = validMarketStates.has(rawState)
    ? (rawState as QuoteSummary['marketState'])
    : 'CLOSED';

  const price = round(toNumber(raw.price));
  const change = round(toNumber(raw.change));
  const previousClose = round(toNumber(raw.previousClose));
  const dayHigh = round(toNumber(raw.dayHigh));
  const dayLow = round(toNumber(raw.dayLow));

  const fiftyTwoWeekHigh = raw.fiftyTwoWeekHigh != null
    ? round(toNumber(raw.fiftyTwoWeekHigh))
    : undefined;
  const fiftyTwoWeekLow = raw.fiftyTwoWeekLow != null
    ? round(toNumber(raw.fiftyTwoWeekLow))
    : undefined;
  const peRatio = raw.peRatio != null
    ? round(toNumber(raw.peRatio))
    : undefined;
  const marketCap = raw.marketCap != null
    ? Math.round(toNumber(raw.marketCap))
    : undefined;

  return {
    symbol,
    name: String(raw.name ?? '').trim() || getDisplayName(symbol),
    price,
    change,
    changePercent,
    previousClose,
    dayHigh,
    dayLow,
    fiftyTwoWeekHigh,
    fiftyTwoWeekLow,
    peRatio,
    volume: Math.round(toNumber(raw.volume)),
    marketCap,
    currency: String(raw.currency ?? 'USD').trim() || 'USD',
    marketState,
  };
}

// ─── Historical data point normalization ──────────────────────────────────────

/**
 * Raw shape accepted by normalizeHistoryPoint.
 * The `date` field may be a string, Date, or timestamp number.
 */
export interface RawHistoryPoint {
  date?: unknown;
  open?: unknown;
  high?: unknown;
  low?: unknown;
  close?: unknown;
  adjClose?: unknown;
  volume?: unknown;
}

/**
 * Normalizes a single raw historical data point.
 *
 * - `date` is coerced to an ISO-8601 YYYY-MM-DD string.
 * - All OHLCV fields are coerced to finite non-negative numbers.
 * - Returns `null` if the `date` cannot be parsed or `close` is zero/missing,
 *   allowing callers to filter out unusable rows with `.filter(Boolean)`.
 */
export function normalizeHistoryPoint(
  raw: RawHistoryPoint,
): HistoricalDataPoint | null {
  // Resolve date
  let dateStr: string;
  if (raw.date instanceof Date) {
    dateStr = raw.date.toISOString().slice(0, 10);
  } else if (typeof raw.date === 'string' && raw.date.length >= 10) {
    dateStr = raw.date.slice(0, 10);
  } else if (typeof raw.date === 'number') {
    dateStr = new Date(raw.date).toISOString().slice(0, 10);
  } else {
    return null; // unparseable date — drop the row
  }

  const close = round(toNumber(raw.close));
  if (close <= 0) return null; // missing close price — drop the row

  return {
    date: dateStr,
    open: round(toNumber(raw.open) || close), // fall back to close if open is missing
    high: round(Math.max(toNumber(raw.high) || close, close)),
    low: round(Math.min(toNumber(raw.low) || close, close)),
    close,
    adjClose: raw.adjClose != null ? round(toNumber(raw.adjClose) || close) : undefined,
    volume: Math.max(0, Math.round(toNumber(raw.volume))),
  };
}

/**
 * Normalizes an array of raw history points, dropping any unparseable rows.
 * Returns the array sorted ascending by date.
 */
export function normalizeHistory(raw: RawHistoryPoint[]): HistoricalDataPoint[] {
  return raw
    .map(normalizeHistoryPoint)
    .filter((p): p is HistoricalDataPoint => p !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}
