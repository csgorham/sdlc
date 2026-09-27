/**
 * mockData.ts — deterministic seed data for tests and mock-mode development.
 *
 * Uses a Mulberry32 seeded PRNG so history values are identical on every run.
 * This ensures snapshot tests and store tests produce stable results.
 *
 * To add a new company: add an entry to MOCK_QUOTES and MOCK_HISTORY_90.
 * The PRNG seed is derived from the symbol string so each company has its
 * own unique but stable price walk.
 */

import type { QuoteSummary, HistoricalDataPoint } from '@/types/finance';

// ─── Seeded PRNG (Mulberry32) ──────────────────────────────────────────────────

/**
 * Returns a pseudo-random number generator seeded with `seed`.
 * Mulberry32 — fast, good distribution, fully deterministic.
 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Converts a symbol string to a stable numeric seed.
 * e.g. "IBM" → consistent integer derived from char codes.
 */
function symbolSeed(symbol: string): number {
  return symbol
    .split('')
    .reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 1) * 31, 0);
}

// ─── Quote snapshots ───────────────────────────────────────────────────────────

export const MOCK_QUOTES: Record<string, QuoteSummary> = {
  IBM: {
    symbol: 'IBM',
    name: 'International Business Machines',
    price: 182.45,
    change: 1.23,
    changePercent: 0.68,
    previousClose: 181.22,
    dayHigh: 183.10,
    dayLow: 180.95,
    fiftyTwoWeekHigh: 199.18,
    fiftyTwoWeekLow: 135.87,
    peRatio: 22.4,
    volume: 3_412_000,
    marketCap: 167_000_000_000,
    currency: 'USD',
    marketState: 'REGULAR',
  },
  MSFT: {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    price: 438.20,
    change: -2.15,
    changePercent: -0.49,
    previousClose: 440.35,
    dayHigh: 440.90,
    dayLow: 436.80,
    fiftyTwoWeekHigh: 468.35,
    fiftyTwoWeekLow: 309.45,
    peRatio: 36.1,
    volume: 18_750_000,
    marketCap: 3_260_000_000_000,
    currency: 'USD',
    marketState: 'REGULAR',
  },
  ORCL: {
    symbol: 'ORCL',
    name: 'Oracle Corporation',
    price: 141.65,
    change: 0.88,
    changePercent: 0.63,
    previousClose: 140.77,
    dayHigh: 142.30,
    dayLow: 140.50,
    fiftyTwoWeekHigh: 167.26,
    fiftyTwoWeekLow: 99.26,
    peRatio: 33.8,
    volume: 7_890_000,
    marketCap: 390_000_000_000,
    currency: 'USD',
    marketState: 'REGULAR',
  },
  SAP: {
    symbol: 'SAP',
    name: 'SAP SE',
    price: 212.30,
    change: 3.40,
    changePercent: 1.63,
    previousClose: 208.90,
    dayHigh: 213.50,
    dayLow: 209.10,
    fiftyTwoWeekHigh: 236.19,
    fiftyTwoWeekLow: 141.82,
    peRatio: 45.2,
    volume: 1_230_000,
    marketCap: 260_000_000_000,
    currency: 'USD',
    marketState: 'REGULAR',
  },
  CRM: {
    symbol: 'CRM',
    name: 'Salesforce Inc.',
    price: 258.75,
    change: -1.60,
    changePercent: -0.61,
    previousClose: 260.35,
    dayHigh: 261.00,
    dayLow: 257.40,
    fiftyTwoWeekHigh: 318.71,
    fiftyTwoWeekLow: 193.07,
    peRatio: 44.6,
    volume: 5_620_000,
    marketCap: 250_000_000_000,
    currency: 'USD',
    marketState: 'REGULAR',
  },
};

// ─── Historical data generator ─────────────────────────────────────────────────

/**
 * Generates `days` trading days of OHLCV data ending today.
 *
 * Uses the Mulberry32 PRNG seeded from `basePrice` and `symbol` so the output
 * is fully deterministic — identical values on every call with the same args.
 * Weekends are skipped to reflect real market calendars.
 */
function generateHistory(
  symbol: string,
  basePrice: number,
  days: number,
): HistoricalDataPoint[] {
  const rand = mulberry32(symbolSeed(symbol) + Math.round(basePrice * 100));
  const result: HistoricalDataPoint[] = [];
  let price = basePrice * 0.88; // start slightly below current for an upward-trending demo

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    if (date.getDay() === 0 || date.getDay() === 6) continue; // skip weekends

    const dailyMove = (rand() - 0.48) * price * 0.014; // ±1.4% daily drift
    const open = round(price);
    const close = round(Math.max(price + dailyMove, 1));
    const high = round(Math.max(open, close) * (1 + rand() * 0.004));
    const low = round(Math.min(open, close) * (1 - rand() * 0.004));
    const volume = Math.round((rand() * 4_000_000) + 1_000_000);

    result.push({
      date: date.toISOString().slice(0, 10),
      open,
      high,
      low,
      close,
      adjClose: close,
      volume,
    });

    price = close;
  }

  return result;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

// Pre-generate 90-day histories. 90 days covers both '7d' and 'quarter' windows.
export const MOCK_HISTORY_90: Record<string, HistoricalDataPoint[]> = {
  IBM:  generateHistory('IBM',  182.45, 90),
  MSFT: generateHistory('MSFT', 438.20, 90),
  ORCL: generateHistory('ORCL', 141.65, 90),
  SAP:  generateHistory('SAP',  212.30, 90),
  CRM:  generateHistory('CRM',  258.75, 90),
};
