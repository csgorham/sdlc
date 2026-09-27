/**
 * dashboardStore — central Zustand store for the finance dashboard.
 *
 * Holds the active time window, the list of tracked symbols, all fetched
 * market data, and async loading/error state.
 *
 * Components read slices via selectors and never call fetchAll() directly —
 * that responsibility belongs to the useMarketData hook.
 */

import { create } from 'zustand';
import type { TimeWindow, MarketData } from '@/types/finance';
import { FinanceError } from '@/types/finance';
import { financeService } from '@/services/financeService';
import { DEFAULT_SYMBOLS } from '@/types/finance';

export interface DashboardState {
  // ── UI state ───────────────────────────────────────────────────────────────
  activeWindow: TimeWindow;
  symbols: string[];

  // ── Data state ─────────────────────────────────────────────────────────────
  data: Record<string, MarketData>;
  loading: boolean;
  error: string | null;

  // ── Actions ────────────────────────────────────────────────────────────────
  setWindow: (window: TimeWindow) => void;
  setSymbols: (symbols: string[]) => void;
  clearError: () => void;
  fetchAll: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  activeWindow: 'day',
  symbols: [...DEFAULT_SYMBOLS],
  data: {},
  loading: false,
  error: null,

  setWindow(window) {
    set({ activeWindow: window });
  },

  setSymbols(symbols) {
    set({ symbols });
  },

  clearError() {
    set({ error: null });
  },

  async fetchAll() {
    const { symbols, activeWindow } = get();
    set({ loading: true, error: null });

    try {
      const results = await Promise.allSettled(
        symbols.map(async (symbol) => {
          const [quote, history] = await Promise.all([
            financeService.getQuote(symbol),
            financeService.getHistory(symbol, activeWindow),
          ]);
          return { symbol, quote, history, lastUpdated: new Date().toISOString() };
        }),
      );

      const newData: Record<string, MarketData> = { ...get().data };
      const errors: string[] = [];

      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { symbol, quote, history, lastUpdated } = result.value;
          newData[symbol] = { quote, history, lastUpdated };
        } else {
          const err = result.reason;
          errors.push(
            err instanceof FinanceError
              ? err.message
              : 'An unexpected error occurred.',
          );
        }
      }

      set({
        data: newData,
        loading: false,
        error: errors.length > 0 ? errors[0] : null,
      });
    } catch (err) {
      const message =
        err instanceof FinanceError
          ? err.message
          : 'An unexpected error occurred.';
      set({ loading: false, error: message });
    }
  },
}));
