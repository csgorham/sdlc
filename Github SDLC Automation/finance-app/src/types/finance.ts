// ─── Time windows ──────────────────────────────────────────────────────────────

export type TimeWindow = 'day' | '7d' | 'quarter';

// ─── Company symbols ───────────────────────────────────────────────────────────

export const DEFAULT_SYMBOLS = ['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM'] as const;
export type DefaultSymbol = (typeof DEFAULT_SYMBOLS)[number];

// ─── Company profile (static metadata, lives in COMPANY_REGISTRY) ─────────────

export interface CompanyProfile {
  /** Uppercase ticker symbol, e.g. "IBM" */
  symbol: string;
  /** Display name used when live data is unavailable */
  displayName: string;
  /** Short description of the company for tooltips / detail panels */
  description: string;
  /** GICS sector, e.g. "Information Technology" */
  sector: string;
  /** Primary exchange, e.g. "NYSE" */
  exchange: string;
}

// ─── Quote summary (current day view) ─────────────────────────────────────────

export interface QuoteSummary {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  /** 52-week high — optional; not always available from all adapters */
  fiftyTwoWeekHigh?: number;
  /** 52-week low — optional; not always available from all adapters */
  fiftyTwoWeekLow?: number;
  /** Price-to-earnings ratio — optional */
  peRatio?: number;
  volume: number;
  marketCap?: number;
  currency: string;
  marketState: 'REGULAR' | 'PRE' | 'POST' | 'CLOSED';
}

// ─── Historical data point (7-day and quarter views) ──────────────────────────

export interface HistoricalDataPoint {
  /** ISO-8601 date string, e.g. "2024-07-01" */
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  /** Adjusted close — may be absent for some sources */
  adjClose?: number;
  volume: number;
}

// ─── Combined market data per symbol ──────────────────────────────────────────

export interface MarketData {
  quote: QuoteSummary;
  history: HistoricalDataPoint[];
  /** ISO-8601 timestamp of when this data was last fetched */
  lastUpdated: string;
}

// ─── Typed error from the finance service layer ───────────────────────────────

export type FinanceErrorCode =
  | 'NETWORK'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'INVALID_RESPONSE'
  | 'UNKNOWN';

export class FinanceError extends Error {
  constructor(
    public readonly code: FinanceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'FinanceError';
  }
}
