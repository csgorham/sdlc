/**
 * FinanceAdapter — stable interface for all data source implementations.
 *
 * Two concrete implementations exist:
 *   - YahooFinanceAdapter  (live data via Node proxy, used in development)
 *   - MockFinanceAdapter   (deterministic seed data, used in tests)
 *
 * The active adapter is selected by VITE_USE_MOCK in financeService.ts.
 * All UI code depends only on this interface — never on a concrete adapter.
 */

import type { QuoteSummary, HistoricalDataPoint, TimeWindow } from '@/types/finance';

export interface FinanceAdapter {
  /**
   * Fetches the current quote summary for a given ticker symbol.
   * Throws FinanceError on failure.
   */
  getQuote(symbol: string): Promise<QuoteSummary>;

  /**
   * Fetches historical OHLCV data for a given symbol and time window.
   * '7d' returns approximately the last 7 calendar days of trading data.
   * 'quarter' returns approximately the last 90 calendar days.
   * Throws FinanceError on failure.
   */
  getHistory(symbol: string, window: TimeWindow): Promise<HistoricalDataPoint[]>;
}
