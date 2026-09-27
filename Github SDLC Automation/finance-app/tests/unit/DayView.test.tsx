/**
 * DayView.test.tsx — UI rendering tests for the current-day dashboard view.
 *
 * The store is pre-seeded via setState so tests are synchronous and do not
 * depend on the financeService. This keeps render tests fast and deterministic.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { MarketData } from '@/types/finance';

// Mock financeService so the store's fetchAll never fires real network calls
vi.mock('@/services/financeService', async () => {
  const { mockFinanceAdapter } = await import('@/services/mockFinanceAdapter');
  return { financeService: mockFinanceAdapter };
});

// Mock useMarketData so tests can control exactly what the view receives,
// including error state, without the hook's useEffect clearing it.
const mockUseMarketData = vi.fn();
vi.mock('@/hooks/useMarketData', () => ({
  useMarketData: () => mockUseMarketData(),
}));

// Import the view under test after the mocks are registered
const { DayView } = await import('@/views/DayView/DayView');

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ibmData: MarketData = {
  quote: {
    symbol: 'IBM', name: 'International Business Machines',
    price: 182.45, change: 1.23, changePercent: 0.68,
    previousClose: 181.22, dayHigh: 183.10, dayLow: 180.95,
    volume: 3_412_000, marketCap: 167_000_000_000,
    fiftyTwoWeekHigh: 199.18, fiftyTwoWeekLow: 135.87, peRatio: 22.4,
    currency: 'USD', marketState: 'REGULAR',
  },
  history: [],
  lastUpdated: '2025-07-01T14:30:00.000Z',
};

const msftData: MarketData = {
  quote: {
    symbol: 'MSFT', name: 'Microsoft Corporation',
    price: 438.20, change: -2.15, changePercent: -0.49,
    previousClose: 440.35, dayHigh: 440.90, dayLow: 436.80,
    volume: 18_750_000, marketCap: 3_260_000_000_000,
    currency: 'USD', marketState: 'REGULAR',
  },
  history: [],
  lastUpdated: '2025-07-01T14:30:00.000Z',
};

const defaultHookReturn = {
  data: { IBM: ibmData, MSFT: msftData },
  loading: false,
  error: null,
  clearError: vi.fn(),
  symbols: ['IBM', 'MSFT'],
  activeWindow: 'day' as const,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DayView', () => {
  beforeEach(() => {
    mockUseMarketData.mockReturnValue(defaultHookReturn);
  });

  it('renders the section heading', () => {
    render(<DayView />);
    expect(screen.getByText("Today's Market Summary")).toBeInTheDocument();
  });

  it('renders a CompanyCard for each tracked symbol', () => {
    render(<DayView />);
    // IBM appears in multiple places (card, spotlight, ranking) — use getAllByText
    expect(screen.getAllByText('IBM').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('MSFT').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the IBM Spotlight panel heading', () => {
    render(<DayView />);
    // "IBM" and "Spotlight" are in sibling child nodes of the <h3>;
    // match via the heading's combined textContent instead.
    const heading = screen.getByRole('heading', { name: /IBM.*Spotlight/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders the IBM spotlight price', () => {
    render(<DayView />);
    expect(screen.getAllByText(/182\.45/).length).toBeGreaterThan(0);
  });

  it('renders the Daily Performance Ranking table', () => {
    render(<DayView />);
    expect(screen.getByText('Daily Performance Ranking')).toBeInTheDocument();
  });

  it('ranking table contains both symbols', () => {
    render(<DayView />);
    const table = screen.getByText('Daily Performance Ranking').closest('div')!;
    expect(table.textContent).toContain('IBM');
    expect(table.textContent).toContain('MSFT');
  });

  it('shows an ErrorAlert when store has an error', () => {
    mockUseMarketData.mockReturnValue({ ...defaultHookReturn, error: 'Test error message' });
    render(<DayView />);
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('shows skeleton when loading with no data', () => {
    mockUseMarketData.mockReturnValue({ ...defaultHookReturn, loading: true, data: {} });
    render(<DayView />);
    expect(screen.queryByText("Today's Market Summary")).not.toBeInTheDocument();
  });
});
