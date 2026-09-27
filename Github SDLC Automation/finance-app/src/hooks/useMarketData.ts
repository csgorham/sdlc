/**
 * useMarketData — triggers fetchAll() on mount and whenever the active
 * time window or symbol list changes. Returns the current data/loading/error
 * slice from the store so views have a single import point.
 *
 * Also re-fetches the focused symbol whenever the time window changes so the
 * focused chart stays in sync with the selected tab.
 */

import { useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';

export function useMarketData() {
  const activeWindow = useDashboardStore((s) => s.activeWindow);
  const symbols = useDashboardStore((s) => s.symbols);
  const data = useDashboardStore((s) => s.data);
  const loading = useDashboardStore((s) => s.loading);
  const error = useDashboardStore((s) => s.error);
  const fetchAll = useDashboardStore((s) => s.fetchAll);
  const clearError = useDashboardStore((s) => s.clearError);
  const focusedSymbol = useDashboardStore((s) => s.focusedSymbol);
  const setFocusedSymbol = useDashboardStore((s) => s.setFocusedSymbol);

  useEffect(() => {
    void fetchAll();
    // Re-fetch when window or symbol list changes
  }, [activeWindow, symbols, fetchAll]);

  // When the time window changes and a company is already focused, reload its
  // history for the new window so the chart stays in sync with the active tab.
  useEffect(() => {
    if (focusedSymbol) {
      void setFocusedSymbol(focusedSymbol);
    }
    // Only re-run when the window changes — not when focusedSymbol itself changes
    // (that is handled by CompanySearch calling setFocusedSymbol directly).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWindow, setFocusedSymbol]);

  return { data, loading, error, clearError, symbols, activeWindow };
}
