/**
 * useMarketData — triggers fetchAll() on mount and whenever the active
 * time window or symbol list changes. Returns the current data/loading/error
 * slice from the store so views have a single import point.
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

  useEffect(() => {
    void fetchAll();
    // Re-fetch when window or symbol list changes
  }, [activeWindow, symbols, fetchAll]);

  return { data, loading, error, clearError, symbols, activeWindow };
}
