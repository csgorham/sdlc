/**
 * MockFinanceAdapter — returns deterministic seed data from mockData.ts,
 * run through the shared normalization layer.
 *
 * Used in all tests and when VITE_USE_MOCK=true.
 * Zero network dependency.
 */

import type { FinanceAdapter } from './financeAdapter';
import type { QuoteSummary, HistoricalDataPoint, TimeWindow } from '@/types/finance';
import { FinanceError } from '@/types/finance';
import { MOCK_QUOTES, MOCK_HISTORY_90 } from './mockData';
import { normalizeQuote, normalizeHistory } from './normalize';

export const mockFinanceAdapter: FinanceAdapter = {
  async getQuote(symbol: string): Promise<QuoteSummary> {
    const raw = MOCK_QUOTES[symbol.toUpperCase()];
    if (!raw) {
      throw new FinanceError('NOT_FOUND', `Symbol not found: ${symbol}`);
    }
    // Run through normalization even for mock data — ensures the mock
    // exercises the same code path as the live adapter.
    return normalizeQuote(raw);
  },

  async getHistory(
    symbol: string,
    window: TimeWindow,
  ): Promise<HistoricalDataPoint[]> {
    const rawHistory = MOCK_HISTORY_90[symbol.toUpperCase()];
    if (!rawHistory) {
      throw new FinanceError('NOT_FOUND', `No history for symbol: ${symbol}`);
    }

    if (window === 'day') return [];

    const cutoffDays = window === '7d' ? 7 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - cutoffDays);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const filtered = rawHistory.filter((p) => p.date >= cutoffStr);
    return normalizeHistory(filtered);
  },
};
