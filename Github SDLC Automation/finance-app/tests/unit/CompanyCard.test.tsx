import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompanyCard } from '@/components/CompanyCard/CompanyCard';
import type { QuoteSummary } from '@/types/finance';

const mockQuote: QuoteSummary = {
  symbol: 'IBM',
  name: 'International Business Machines',
  price: 182.45,
  change: 1.23,
  changePercent: 0.68,
  previousClose: 181.22,
  dayHigh: 183.10,
  dayLow: 180.95,
  volume: 3_412_000,
  currency: 'USD',
  marketState: 'REGULAR',
};

describe('CompanyCard', () => {
  it('renders the symbol', () => {
    render(<CompanyCard quote={mockQuote} />);
    expect(screen.getByText('IBM')).toBeInTheDocument();
  });

  it('renders the company name', () => {
    render(<CompanyCard quote={mockQuote} />);
    expect(screen.getByText('International Business Machines')).toBeInTheDocument();
  });

  it('renders the formatted price', () => {
    render(<CompanyCard quote={mockQuote} />);
    expect(screen.getByText(/182\.45/)).toBeInTheDocument();
  });

  it('renders the change as positive with + sign', () => {
    render(<CompanyCard quote={mockQuote} />);
    expect(screen.getByText(/\+1\.23/)).toBeInTheDocument();
  });

  it('renders negative change without + sign', () => {
    const negativeQuote = { ...mockQuote, change: -2.15, changePercent: -0.49 };
    render(<CompanyCard quote={negativeQuote} />);
    expect(screen.getByText(/-2\.15/)).toBeInTheDocument();
  });

  it('shows Open badge when market is REGULAR', () => {
    render(<CompanyCard quote={mockQuote} />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('shows CLOSED badge when market is CLOSED', () => {
    render(<CompanyCard quote={{ ...mockQuote, marketState: 'CLOSED' }} />);
    expect(screen.getByText('CLOSED')).toBeInTheDocument();
  });
});
