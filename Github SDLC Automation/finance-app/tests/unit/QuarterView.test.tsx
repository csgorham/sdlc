/**
 * QuarterView.test.tsx — UI rendering tests for the quarterly comparison view.
 *
 * useMarketData is mocked at module level so tests control the exact data
 * the view receives, including error and loading states, without the hook's
 * useEffect interfering.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { MarketData, HistoricalDataPoint } from '@/types/finance';

vi.mock('@/services/financeService', async () => {
  const { mockFinanceAdapter } = await import('@/services/mockFinanceAdapter');
  return { financeService: mockFinanceAdapter };
});

const mockUseMarketData = vi.fn();
vi.mock('@/hooks/useMarketData', () => ({
  useMarketData: () => mockUseMarketData(),
}));

const { QuarterView } = await import('@/views/QuarterView/QuarterView');

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeHistory(closes: number[]): HistoricalDataPoint[] {
  return closes.map((close, i) => ({
    date: `2024-0${Math.ceil((i + 1) / 30)}-${String((i % 30) + 1).padStart(2, '0')}`,
    open: close, high: close * 1.01, low: close * 0.99, close,
    volume: 1_000_000,
  }));
}

// 30-point histories so computePeriodStats runs
const ibmCloses  = Array.from({ length: 30 }, (_, i) => 180 + i * 0.3);
const msftCloses = Array.from({ length: 30 }, (_, i) => 430 - i * 0.2);

const stubData: Record<string, MarketData> = {
  IBM: {
    quote: {
      symbol: 'IBM', name: 'IBM', price: 188.7, change: 1, changePercent: 0.5,
      previousClose: 187.7, dayHigh: 189, dayLow: 187, volume: 3_000_000,
      currency: 'USD', marketState: 'REGULAR',
    },
    history: makeHistory(ibmCloses),
    lastUpdated: '2025-07-01T14:00:00.000Z',
  },
  MSFT: {
    quote: {
      symbol: 'MSFT', name: 'Microsoft', price: 424.2, change: -1, changePercent: -0.2,
      previousClose: 425.2, dayHigh: 426, dayLow: 423, volume: 15_000_000,
      currency: 'USD', marketState: 'REGULAR',
    },
    history: makeHistory(msftCloses),
    lastUpdated: '2025-07-01T14:00:00.000Z',
  },
};

const defaultHookReturn = {
  data: stubData,
  loading: false,
  error: null,
  clearError: vi.fn(),
  symbols: ['IBM', 'MSFT'],
  activeWindow: 'quarter' as const,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('QuarterView', () => {
  beforeEach(() => {
    mockUseMarketData.mockReturnValue(defaultHookReturn);
  });

  it('renders the Last Quarter Comparison heading', () => {
    render(<QuarterView />);
    expect(screen.getByText('Last Quarter Comparison')).toBeInTheDocument();
  });

  it('renders the total return bar chart title', () => {
    render(<QuarterView />);
    expect(screen.getByText('Total Return from Period Start (%)')).toBeInTheDocument();
  });

  it('renders the Quarter Period Stats table', () => {
    render(<QuarterView />);
    expect(screen.getByText('Quarter Period Stats')).toBeInTheDocument();
  });

  it('stats table has Start column header', () => {
    render(<QuarterView />);
    expect(screen.getByText('Start')).toBeInTheDocument();
  });

  it('stats table has Return column header', () => {
    render(<QuarterView />);
    expect(screen.getByText('Return')).toBeInTheDocument();
  });

  it('renders both tracked symbols in the stats table', () => {
    render(<QuarterView />);
    const table = screen.getByText('Quarter Period Stats').closest('div')!;
    expect(table.textContent).toContain('IBM');
    expect(table.textContent).toContain('MSFT');
  });

  it('IBM has positive return badge (IBMs closes trend upward)', () => {
    render(<QuarterView />);
    // IBM closes go from 180 → 188.7 — should show + return
    const table = screen.getByText('Quarter Period Stats').closest('div')!;
    expect(table.textContent).toMatch(/\+[\d.]+%/);
  });

  it('shows skeleton when loading with no data', () => {
    mockUseMarketData.mockReturnValue({ ...defaultHookReturn, loading: true, data: {} });
    render(<QuarterView />);
    expect(screen.queryByText('Last Quarter Comparison')).not.toBeInTheDocument();
  });

  it('shows error alert when store has an error', () => {
    mockUseMarketData.mockReturnValue({ ...defaultHookReturn, error: 'Rate limited' });
    render(<QuarterView />);
    expect(screen.getByText('Rate limited')).toBeInTheDocument();
  });

  it('renders no stats table when all symbols have empty history', () => {
    mockUseMarketData.mockReturnValue({
      ...defaultHookReturn,
      data: {
        IBM:  { ...stubData.IBM,  history: [] },
        MSFT: { ...stubData.MSFT, history: [] },
      },
    });
    render(<QuarterView />);
    expect(screen.queryByText('Quarter Period Stats')).not.toBeInTheDocument();
  });
});
