import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDashboardStore } from '@/store/dashboardStore';

// vi.mock is hoisted to the top of the file by Vitest before any imports are
// resolved, so we cannot reference imported variables inside the factory.
// Use a dynamic import inside the factory instead.
vi.mock('@/services/financeService', async () => {
  const { mockFinanceAdapter } = await import('@/services/mockFinanceAdapter');
  return { financeService: mockFinanceAdapter };
});

describe('dashboardStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useDashboardStore.setState({
      activeWindow: 'day',
      symbols: ['IBM', 'MSFT'],
      data: {},
      loading: false,
      error: null,
    });
  });

  it('initialises with the day window', () => {
    expect(useDashboardStore.getState().activeWindow).toBe('day');
  });

  it('setWindow updates the active window', () => {
    useDashboardStore.getState().setWindow('7d');
    expect(useDashboardStore.getState().activeWindow).toBe('7d');
  });

  it('setSymbols updates the tracked symbols', () => {
    useDashboardStore.getState().setSymbols(['IBM', 'ORCL']);
    expect(useDashboardStore.getState().symbols).toEqual(['IBM', 'ORCL']);
  });

  it('fetchAll populates data for all symbols', async () => {
    await useDashboardStore.getState().fetchAll();
    const { data } = useDashboardStore.getState();
    expect(data['IBM']).toBeDefined();
    expect(data['IBM'].quote.symbol).toBe('IBM');
    expect(data['MSFT']).toBeDefined();
  });

  it('fetchAll sets loading to false after completion', async () => {
    await useDashboardStore.getState().fetchAll();
    expect(useDashboardStore.getState().loading).toBe(false);
  });

  it('fetchAll sets error for an invalid symbol', async () => {
    useDashboardStore.setState({ symbols: ['INVALID_XYZ'] });
    await useDashboardStore.getState().fetchAll();
    expect(useDashboardStore.getState().error).not.toBeNull();
  });

  it('clearError sets error to null', async () => {
    useDashboardStore.setState({ error: 'some error' });
    useDashboardStore.getState().clearError();
    expect(useDashboardStore.getState().error).toBeNull();
  });
});
