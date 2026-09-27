/**
 * YahooFinanceAdapter — fetches live data through the Node proxy at /api/finance.
 *
 * The proxy (server/proxy.js) calls yahoo-finance2 server-side, which avoids
 * browser-side CORS restrictions imposed by Yahoo Finance.
 *
 * Every response is run through the shared normalization layer (normalize.ts)
 * before being returned to the store — the UI never sees a raw wire shape.
 *
 * Used when VITE_USE_MOCK is not 'true'.
 */

import type { FinanceAdapter } from './financeAdapter';
import type { QuoteSummary, HistoricalDataPoint, TimeWindow } from '@/types/finance';
import { FinanceError } from '@/types/finance';
import { normalizeQuote, normalizeHistory, type RawQuote, type RawHistoryPoint } from './normalize';
import { windowStartDate, today } from '@/utils/dateUtils';

// ─── HTTP helpers ──────────────────────────────────────────────────────────────

interface ProxyErrorBody {
  error?: string;
}

/**
 * Fetches a URL and returns the parsed JSON body.
 * Maps HTTP error statuses to typed FinanceErrors.
 */
async function fetchJson<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new FinanceError(
      'NETWORK',
      'Unable to reach market data. Check your connection.',
    );
  }

  if (!response.ok) {
    // Try to read the proxy's error body for a more specific message.
    let proxyMessage: string | undefined;
    try {
      const body = (await response.json()) as ProxyErrorBody;
      proxyMessage = body.error;
    } catch {
      // ignore — body may not be JSON
    }

    if (response.status === 404) {
      throw new FinanceError(
        'NOT_FOUND',
        proxyMessage ?? 'Symbol not found. Try a different ticker.',
      );
    }
    if (response.status === 429) {
      throw new FinanceError(
        'RATE_LIMITED',
        proxyMessage ?? 'Too many requests. Please wait and retry.',
      );
    }
    throw new FinanceError(
      'UNKNOWN',
      proxyMessage ?? `Unexpected error (HTTP ${response.status})`,
    );
  }

  return response.json() as Promise<T>;
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export const yahooFinanceAdapter: FinanceAdapter = {
  async getQuote(symbol: string): Promise<QuoteSummary> {
    const raw = await fetchJson<RawQuote>(
      `/api/finance/quote/${encodeURIComponent(symbol.toUpperCase())}`,
    );
    return normalizeQuote(raw);
  },

  async getHistory(
    symbol: string,
    window: TimeWindow,
  ): Promise<HistoricalDataPoint[]> {
    if (window === 'day') return [];

    const start = windowStartDate(window as '7d' | 'quarter');
    const end = today();
    const url = `/api/finance/history/${encodeURIComponent(symbol.toUpperCase())}?start=${start}&end=${end}`;
    const raw = await fetchJson<RawHistoryPoint[]>(url);
    return normalizeHistory(raw);
  },
};
