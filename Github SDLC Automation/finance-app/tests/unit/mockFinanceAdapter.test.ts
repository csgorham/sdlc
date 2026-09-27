import { describe, it, expect } from 'vitest';
import { mockFinanceAdapter } from '@/services/mockFinanceAdapter';
import { FinanceError } from '@/types/finance';

describe('mockFinanceAdapter.getQuote', () => {
  it('returns a quote for a known symbol', async () => {
    const quote = await mockFinanceAdapter.getQuote('IBM');
    expect(quote.symbol).toBe('IBM');
    expect(quote.price).toBeGreaterThan(0);
    expect(quote.currency).toBe('USD');
  });

  it('is case-insensitive', async () => {
    const quote = await mockFinanceAdapter.getQuote('ibm');
    expect(quote.symbol).toBe('IBM');
  });

  it('throws FinanceError with NOT_FOUND for unknown symbol', async () => {
    await expect(mockFinanceAdapter.getQuote('INVALID_XYZ')).rejects.toThrow(
      FinanceError,
    );
    try {
      await mockFinanceAdapter.getQuote('INVALID_XYZ');
    } catch (err) {
      expect((err as FinanceError).code).toBe('NOT_FOUND');
    }
  });
});

describe('mockFinanceAdapter.getHistory', () => {
  it('returns an array of historical points for 7d window', async () => {
    const history = await mockFinanceAdapter.getHistory('IBM', '7d');
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });

  it('returns more points for quarter window than 7d window', async () => {
    const week = await mockFinanceAdapter.getHistory('MSFT', '7d');
    const quarter = await mockFinanceAdapter.getHistory('MSFT', 'quarter');
    expect(quarter.length).toBeGreaterThanOrEqual(week.length);
  });

  it('returns empty array for day window', async () => {
    const history = await mockFinanceAdapter.getHistory('IBM', 'day');
    expect(history).toHaveLength(0);
  });

  it('throws FinanceError for unknown symbol', async () => {
    await expect(
      mockFinanceAdapter.getHistory('UNKNOWN', '7d'),
    ).rejects.toThrow(FinanceError);
  });
});
