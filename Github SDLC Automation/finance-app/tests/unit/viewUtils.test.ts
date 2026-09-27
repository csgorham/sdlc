import { describe, it, expect } from 'vitest';
import {
  periodBounds,
  periodReturnPct,
  computePeriodStats,
  formatTimestamp,
  formatMarketCap,
} from '@/utils/viewUtils';
import type { HistoricalDataPoint } from '@/types/finance';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeHistory(closes: number[]): HistoricalDataPoint[] {
  return closes.map((close, i) => ({
    date: `2024-07-${String(i + 1).padStart(2, '0')}`,
    open: close,
    high: close * 1.01,
    low: close * 0.99,
    close,
    volume: 1_000_000,
  }));
}

// ─── periodBounds ─────────────────────────────────────────────────────────────

describe('periodBounds', () => {
  it('returns null for empty history', () => {
    expect(periodBounds([])).toBeNull();
  });

  it('returns first and last close for a single-entry array', () => {
    const result = periodBounds(makeHistory([100]));
    expect(result).toEqual({ first: 100, last: 100 });
  });

  it('returns correct first and last for multi-entry array', () => {
    const result = periodBounds(makeHistory([100, 105, 98, 110]));
    expect(result?.first).toBe(100);
    expect(result?.last).toBe(110);
  });

  it('does not return middle values as first or last', () => {
    const result = periodBounds(makeHistory([50, 999, 75]));
    expect(result?.first).toBe(50);
    expect(result?.last).toBe(75);
  });
});

// ─── periodReturnPct ──────────────────────────────────────────────────────────

describe('periodReturnPct', () => {
  it('returns null when startPrice is 0 (division-by-zero guard)', () => {
    expect(periodReturnPct(0, 100)).toBeNull();
  });

  it('calculates positive return correctly', () => {
    // 100 → 110 = +10%
    expect(periodReturnPct(100, 110)).toBeCloseTo(10.0, 5);
  });

  it('calculates negative return correctly', () => {
    // 100 → 90 = -10%
    expect(periodReturnPct(100, 90)).toBeCloseTo(-10.0, 5);
  });

  it('returns 0 for flat price (start === end)', () => {
    expect(periodReturnPct(150, 150)).toBe(0);
  });

  it('handles large price values without precision loss', () => {
    const result = periodReturnPct(1000, 1050);
    expect(result).toBeCloseTo(5.0, 4);
  });
});

// ─── computePeriodStats ───────────────────────────────────────────────────────

describe('computePeriodStats', () => {
  const mockData = {
    IBM:  { history: makeHistory([180, 185, 178, 190]) }, // return ~+5.56%
    MSFT: { history: makeHistory([430, 420, 415, 425]) }, // return ~-1.16%
    ORCL: { history: [] },                                // filtered out (< 2 points)
    SAP:  { history: makeHistory([200]) },                // filtered out (< 2 points)
  };

  it('excludes symbols with fewer than 2 history points', () => {
    const stats = computePeriodStats(['IBM', 'MSFT', 'ORCL', 'SAP'], mockData);
    const symbols = stats.map((s) => s.symbol);
    expect(symbols).toContain('IBM');
    expect(symbols).toContain('MSFT');
    expect(symbols).not.toContain('ORCL');
    expect(symbols).not.toContain('SAP');
  });

  it('sorts results descending by returnPct', () => {
    const stats = computePeriodStats(['IBM', 'MSFT'], mockData);
    expect(stats[0].symbol).toBe('IBM');   // higher return
    expect(stats[1].symbol).toBe('MSFT');  // lower return
  });

  it('computes startPrice as first close', () => {
    const stats = computePeriodStats(['IBM'], mockData);
    expect(stats[0].startPrice).toBe(180);
  });

  it('computes endPrice as last close', () => {
    const stats = computePeriodStats(['IBM'], mockData);
    expect(stats[0].endPrice).toBe(190);
  });

  it('computes high as max of all high values', () => {
    const stats = computePeriodStats(['IBM'], mockData);
    // Each high is close * 1.01; max close is 190, so high ≈ 191.9
    expect(stats[0].high).toBeCloseTo(190 * 1.01, 1);
  });

  it('computes low as min of all low values', () => {
    const stats = computePeriodStats(['IBM'], mockData);
    // Each low is close * 0.99; min close is 178, so low ≈ 176.22
    expect(stats[0].low).toBeCloseTo(178 * 0.99, 1);
  });

  it('computes returnPct correctly', () => {
    const stats = computePeriodStats(['IBM'], mockData);
    // (190 - 180) / 180 * 100 = 5.555...%
    expect(stats[0].returnPct).toBeCloseTo(5.556, 2);
  });

  it('returns empty array when no symbols have enough data', () => {
    expect(computePeriodStats(['ORCL', 'SAP'], mockData)).toHaveLength(0);
  });

  it('returns empty array for empty symbol list', () => {
    expect(computePeriodStats([], mockData)).toHaveLength(0);
  });
});

// ─── formatTimestamp ──────────────────────────────────────────────────────────

describe('formatTimestamp', () => {
  it('formats a UTC ISO timestamp as a time string', () => {
    // We only check the format is non-empty and includes AM/PM
    const result = formatTimestamp('2025-07-01T14:32:00.000Z');
    expect(result).toBeTruthy();
    expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
  });

  it('returns a string (does not throw)', () => {
    expect(() => formatTimestamp('2025-01-15T09:00:00.000Z')).not.toThrow();
  });
});

// ─── formatMarketCap ──────────────────────────────────────────────────────────

describe('formatMarketCap', () => {
  it('formats trillions with two decimal places', () => {
    expect(formatMarketCap(3_260_000_000_000)).toBe('$3.26T');
  });

  it('formats billions with one decimal place', () => {
    expect(formatMarketCap(167_000_000_000)).toBe('$167.0B');
  });

  it('formats millions with zero decimal places', () => {
    expect(formatMarketCap(500_000_000)).toBe('$500M');
  });

  it('formats values just above $1T threshold', () => {
    expect(formatMarketCap(1_000_000_000_000)).toBe('$1.00T');
  });

  it('formats values just below $1B threshold as millions', () => {
    expect(formatMarketCap(999_000_000)).toBe('$999M');
  });
});

// ─── chartColors.colorFor ─────────────────────────────────────────────────────
// Imported separately since colorFor lives in chartColors, not viewUtils

import { colorFor, SYMBOL_COLORS } from '@/utils/chartColors';

describe('colorFor', () => {
  it('returns IBM blue for IBM', () => {
    expect(colorFor('IBM')).toBe('#0f62fe');
  });

  it('returns known color for each default symbol', () => {
    for (const [symbol, color] of Object.entries(SYMBOL_COLORS)) {
      expect(colorFor(symbol)).toBe(color);
    }
  });

  it('returns a fallback color for unknown symbols', () => {
    const result = colorFor('UNKNOWN', 0);
    expect(result).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('cycles through fallback colors by index', () => {
    const a = colorFor('UNKNOWN', 0);
    const b = colorFor('UNKNOWN', 1);
    expect(a).not.toBe(b);
  });

  it('is case-sensitive — lowercase ibm uses fallback', () => {
    expect(colorFor('ibm')).not.toBe('#0f62fe');
  });
});
