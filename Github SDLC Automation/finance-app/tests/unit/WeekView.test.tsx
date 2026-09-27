/**
 * WeekView.test.tsx — UI rendering tests for the 7-day trend view.
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

const { WeekView } = await import('@/views/WeekView/WeekView');

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeHistory(closes: number[]): HistoricalDataPoint[] {
  return closes.map((close, i) => ({
    date: `2024-07-${String(i + 1).padStart(2, '0')}`,
    open: close, high: close * 1.01, low: close * 0.99, close,
    volume: 1_000_000,
  }));
}

const ibmHistory  = makeHistory([180, 183, 179, 185, 182]);
const msftHistory = makeHistory([430, 428, 432, 435, 433]);

const stubData: Record<string, MarketData> = {
  IBM: {
    quote: {
      symbol: 'IBM', name: 'IBM', price: 182, change: 2, changePercent: 1.1,
      previousClose: 180, dayHigh: 185, dayLow: 179, volume: 3_000_000,
      currency: 'USD', marketState: 'REGULAR',
    },
    history: ibmHistory,
    lastUpdated: '2025-07-05T14:00:00.000Z',
  },
  MSFT: {
    quote: {
      symbol: 'MSFT', name: 'Microsoft', price: 433, change: 3, changePercent: 0.7,
      previousClose: 430, dayHigh: 436, dayLow: 428, volume: 18_000_000,
      currency: 'USD', marketState: 'REGULAR',
    },
    history: msftHistory,
    lastUpdated: '2025-07-05T14:00:00.000Z',
  },
};

const defaultHookReturn = {
  data: stubData,
  loading: false,
  error: null,
  clearError: vi.fn(),
  symbols: ['IBM', 'MSFT'],
  activeWindow: '7d' as const,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('WeekView', () => {
  beforeEach(() => {
    mockUseMarketData.mockReturnValue(defaultHookReturn);
  });

  it('renders the 7-Day section heading', () => {
    render(<WeekView />);
    expect(screen.getByText('7-Day Trend Comparison')).toBeInTheDocument();
  });

  it('renders a delta chip for each symbol', () => {
    render(<WeekView />);
    // Each chip shows the symbol label
    const chips = screen.getAllByText(/^(IBM|MSFT)$/);
    expect(chips.length).toBeGreaterThanOrEqual(2);
  });

  it('renders positive return chip with + prefix', () => {
    render(<WeekView />);
    // IBM ≈ +1.11%, MSFT ≈ +0.70% — both positive, so at least one + chip exists
    const plusChips = screen.getAllByText(/\+.*%/);
    expect(plusChips.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the 7-Day Summary table', () => {
    render(<WeekView />);
    expect(screen.getByText('7-Day Summary')).toBeInTheDocument();
  });

  it('renders Current Price column header', () => {
    render(<WeekView />);
    expect(screen.getByText('Current Price')).toBeInTheDocument();
  });

  it('renders vs IBM column header', () => {
    render(<WeekView />);
    expect(screen.getByText('vs IBM')).toBeInTheDocument();
  });

  it('renders IBM row in the summary table', () => {
    render(<WeekView />);
    const table = screen.getByText('7-Day Summary').closest('div')!;
    expect(table.textContent).toContain('IBM');
  });

  it('shows skeleton when loading with no data', () => {
    mockUseMarketData.mockReturnValue({ ...defaultHookReturn, loading: true, data: {} });
    render(<WeekView />);
    expect(screen.queryByText('7-Day Trend Comparison')).not.toBeInTheDocument();
  });

  it('shows error alert when store has an error', () => {
    mockUseMarketData.mockReturnValue({ ...defaultHookReturn, error: 'Network failure' });
    render(<WeekView />);
    expect(screen.getByText('Network failure')).toBeInTheDocument();
  });
});
