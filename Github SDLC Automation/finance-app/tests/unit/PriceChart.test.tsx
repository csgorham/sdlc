/**
 * PriceChart.test.tsx — rendering tests for the shared chart component.
 *
 * We test the component's structural output (title, subtitle, empty state),
 * not Recharts SVG internals — those are not part of the application contract.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriceChart } from '@/components/PriceChart/PriceChart';
import type { HistoricalDataPoint } from '@/types/finance';

function makeHistory(closes: number[]): HistoricalDataPoint[] {
  return closes.map((close, i) => ({
    date: `2024-07-${String(i + 1).padStart(2, '0')}`,
    open: close, high: close * 1.01, low: close * 0.99, close,
    volume: 1_000_000,
  }));
}

const ibmHistory  = makeHistory([180, 182, 184, 181, 185]);
const msftHistory = makeHistory([430, 432, 428, 435, 433]);

describe('PriceChart', () => {
  const baseProps = {
    seriesData: { IBM: ibmHistory, MSFT: msftHistory },
    symbols: ['IBM', 'MSFT'],
    windowType: '7d' as const,
    title: 'Test Chart Title',
  };

  it('renders the chart title', () => {
    render(<PriceChart {...baseProps} />);
    expect(screen.getByText('Test Chart Title')).toBeInTheDocument();
  });

  it('renders an optional subtitle', () => {
    render(<PriceChart {...baseProps} subtitle="Some subtitle text" />);
    expect(screen.getByText('Some subtitle text')).toBeInTheDocument();
  });

  it('does not render a subtitle element when subtitle is omitted', () => {
    render(<PriceChart {...baseProps} />);
    expect(screen.queryByText('Some subtitle text')).not.toBeInTheDocument();
  });

  it('renders the empty state message when all series are empty', () => {
    render(
      <PriceChart
        {...baseProps}
        seriesData={{ IBM: [], MSFT: [] }}
        title="Empty Chart"
      />,
    );
    expect(screen.getByText('No historical data available for this time window.')).toBeInTheDocument();
  });

  it('still renders the title in empty state', () => {
    render(
      <PriceChart
        {...baseProps}
        seriesData={{ IBM: [], MSFT: [] }}
        title="Empty Chart Title"
      />,
    );
    expect(screen.getByText('Empty Chart Title')).toBeInTheDocument();
  });

  it('renders without throwing for area chart (quarter window)', () => {
    expect(() =>
      render(<PriceChart {...baseProps} windowType="quarter" title="Quarter Chart" />),
    ).not.toThrow();
  });

  it('renders without throwing for line chart (7d window)', () => {
    expect(() =>
      render(<PriceChart {...baseProps} windowType="7d" title="Week Chart" />),
    ).not.toThrow();
  });

  it('renders without throwing when only one symbol has data', () => {
    expect(() =>
      render(
        <PriceChart
          {...baseProps}
          seriesData={{ IBM: ibmHistory, MSFT: [] }}
          title="Partial Data"
        />,
      ),
    ).not.toThrow();
  });
});
