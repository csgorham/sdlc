/**
 * dashboardStore.focused.test.ts
 *
 * Tests for the focused-symbol slice added by the user-selected company graph
 * feature. Covers the happy path, error path, clear, and the initial state.
 * Uses the same mock adapter pattern as dashboardStore.test.ts.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDashboardStore } from '@/store/dashboardStore';

vi.mock('@/services/financeService', async () => {
  const { mockFinanceAdapter } = await import('@/services/mockFinanceAdapter');
  return { financeService: mockFinanceAdapter };
});

describe('dashboardStore — focused-symbol slice', () => {
  beforeEach(() => {
    useDashboardStore.setState({
      activeWindow: 'day',
      symbols: ['IBM', 'MSFT'],
      data: {},
      loading: false,
      error: null,
      focusedSymbol: null,
      focusedData: null,
      focusedLoading: false,
      focusedError: null,
    });
  });

  it('initialises with focusedSymbol null', () => {
    expect(useDashboardStore.getState().focusedSymbol).toBeNull();
  });

  it('initialises with focusedData null', () => {
    expect(useDashboardStore.getState().focusedData).toBeNull();
  });

  it('setFocusedSymbol(null) clears all focused state without fetching', async () => {
    // Pre-populate focused state so we can verify it is cleared
    useDashboardStore.setState({
      focusedSymbol: 'IBM',
      focusedData: { quote: {} as never, history: [], lastUpdated: '' },
      focusedLoading: false,
      focusedError: 'old error',
    });

    await useDashboardStore.getState().setFocusedSymbol(null);

    const { focusedSymbol, focusedData, focusedLoading, focusedError } =
      useDashboardStore.getState();
    expect(focusedSymbol).toBeNull();
    expect(focusedData).toBeNull();
    expect(focusedLoading).toBe(false);
    expect(focusedError).toBeNull();
  });

  it('setFocusedSymbol("IBM") populates focusedData for a known symbol', async () => {
    await useDashboardStore.getState().setFocusedSymbol('IBM');

    const { focusedSymbol, focusedData, focusedLoading, focusedError } =
      useDashboardStore.getState();
    expect(focusedSymbol).toBe('IBM');
    expect(focusedData).not.toBeNull();
    expect(focusedData!.quote.symbol).toBe('IBM');
    expect(focusedLoading).toBe(false);
    expect(focusedError).toBeNull();
  });

  it('setFocusedSymbol for a known symbol does not modify symbols[]', async () => {
    const symbolsBefore = useDashboardStore.getState().symbols;
    await useDashboardStore.getState().setFocusedSymbol('IBM');
    expect(useDashboardStore.getState().symbols).toEqual(symbolsBefore);
  });

  it('setFocusedSymbol for a known symbol does not modify data{}', async () => {
    const dataBefore = useDashboardStore.getState().data;
    await useDashboardStore.getState().setFocusedSymbol('IBM');
    expect(useDashboardStore.getState().data).toEqual(dataBefore);
  });

  it('setFocusedSymbol sets focusedError for an unknown symbol', async () => {
    await useDashboardStore.getState().setFocusedSymbol('ZZZZZ');

    const { focusedError, focusedData, focusedLoading } =
      useDashboardStore.getState();
    expect(focusedError).not.toBeNull();
    expect(focusedData).toBeNull();
    expect(focusedLoading).toBe(false);
  });

  it('setFocusedSymbol for an unknown symbol does not set the global error', async () => {
    await useDashboardStore.getState().setFocusedSymbol('ZZZZZ');
    expect(useDashboardStore.getState().error).toBeNull();
  });
});
