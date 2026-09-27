import { describe, it, expect } from 'vitest';
import {
  normalizeQuote,
  normalizeHistoryPoint,
  normalizeHistory,
  type RawQuote,
  type RawHistoryPoint,
} from '@/services/normalize';
import { FinanceError } from '@/types/finance';

// ─── normalizeQuote ────────────────────────────────────────────────────────────

describe('normalizeQuote', () => {
  const validRaw: RawQuote = {
    symbol: 'ibm',
    name: 'International Business Machines',
    price: '182.45',
    change: '1.23',
    changePercent: '0.0068', // decimal fraction — should become 0.68
    previousClose: '181.22',
    dayHigh: '183.10',
    dayLow: '180.95',
    volume: '3412000',
    marketCap: '167000000000',
    currency: 'USD',
    marketState: 'REGULAR',
  };

  it('uppercases the symbol', () => {
    expect(normalizeQuote(validRaw).symbol).toBe('IBM');
  });

  it('preserves the name', () => {
    expect(normalizeQuote(validRaw).name).toBe('International Business Machines');
  });

  it('coerces string price to number', () => {
    expect(normalizeQuote(validRaw).price).toBe(182.45);
  });

  it('converts changePercent from decimal fraction to percentage', () => {
    // 0.0068 → 0.68
    expect(normalizeQuote(validRaw).changePercent).toBeCloseTo(0.68, 1);
  });

  it('leaves changePercent unchanged when already > 1 (pre-multiplied source)', () => {
    const raw = { ...validRaw, changePercent: '2.5' };
    expect(normalizeQuote(raw).changePercent).toBe(2.5);
  });

  it('coerces volume to integer', () => {
    expect(normalizeQuote(validRaw).volume).toBe(3_412_000);
  });

  it('validates marketState — accepts REGULAR', () => {
    expect(normalizeQuote(validRaw).marketState).toBe('REGULAR');
  });

  it('falls back marketState to CLOSED for unknown values', () => {
    const raw = { ...validRaw, marketState: 'HALTED' };
    expect(normalizeQuote(raw).marketState).toBe('CLOSED');
  });

  it('falls back name to registry display name when name is empty', () => {
    const raw = { ...validRaw, name: '' };
    // IBM is in the registry, so displayName "IBM" should be used
    expect(normalizeQuote(raw).name).toBe('IBM');
  });

  it('falls back name to symbol when not in registry and name is empty', () => {
    const raw = { ...validRaw, symbol: 'UNKNWN', name: '' };
    expect(normalizeQuote(raw).name).toBe('UNKNWN');
  });

  it('maps optional 52-week fields when present', () => {
    const raw = { ...validRaw, fiftyTwoWeekHigh: '199.18', fiftyTwoWeekLow: '135.87' };
    const result = normalizeQuote(raw);
    expect(result.fiftyTwoWeekHigh).toBe(199.18);
    expect(result.fiftyTwoWeekLow).toBe(135.87);
  });

  it('leaves optional fields undefined when absent', () => {
    const result = normalizeQuote(validRaw);
    expect(result.fiftyTwoWeekHigh).toBeUndefined();
    expect(result.peRatio).toBeUndefined();
  });

  it('throws FinanceError INVALID_RESPONSE when symbol is missing', () => {
    expect(() => normalizeQuote({ ...validRaw, symbol: '' })).toThrow(FinanceError);
    try {
      normalizeQuote({ ...validRaw, symbol: '' });
    } catch (e) {
      expect((e as FinanceError).code).toBe('INVALID_RESPONSE');
    }
  });

  it('coerces NaN fields to 0', () => {
    const raw = { ...validRaw, price: 'bad', change: null };
    const result = normalizeQuote(raw);
    expect(result.price).toBe(0);
    expect(result.change).toBe(0);
  });
});

// ─── normalizeHistoryPoint ─────────────────────────────────────────────────────

describe('normalizeHistoryPoint', () => {
  const validRaw: RawHistoryPoint = {
    date: '2024-07-01',
    open: 181.0,
    high: 183.5,
    low: 180.5,
    close: 182.45,
    adjClose: 182.45,
    volume: 3_000_000,
  };

  it('returns a normalized point for valid input', () => {
    const pt = normalizeHistoryPoint(validRaw);
    expect(pt).not.toBeNull();
    expect(pt!.date).toBe('2024-07-01');
    expect(pt!.close).toBe(182.45);
  });

  it('accepts a Date object for the date field', () => {
    const raw = { ...validRaw, date: new Date('2024-07-01T00:00:00Z') };
    expect(normalizeHistoryPoint(raw)?.date).toBe('2024-07-01');
  });

  it('accepts a timestamp number for the date field', () => {
    const raw = { ...validRaw, date: new Date('2024-07-01').getTime() };
    expect(normalizeHistoryPoint(raw)?.date).toBe('2024-07-01');
  });

  it('returns null when date is missing', () => {
    expect(normalizeHistoryPoint({ ...validRaw, date: undefined })).toBeNull();
  });

  it('returns null when close is 0 or missing', () => {
    expect(normalizeHistoryPoint({ ...validRaw, close: 0 })).toBeNull();
    expect(normalizeHistoryPoint({ ...validRaw, close: undefined })).toBeNull();
  });

  it('falls back open to close when open is missing', () => {
    const pt = normalizeHistoryPoint({ ...validRaw, open: undefined });
    expect(pt!.open).toBe(validRaw.close);
  });

  it('ensures high >= close', () => {
    const pt = normalizeHistoryPoint({ ...validRaw, high: 1 }); // low bogus high
    expect(pt!.high).toBeGreaterThanOrEqual(pt!.close);
  });

  it('ensures low <= close', () => {
    const pt = normalizeHistoryPoint({ ...validRaw, low: 9999 }); // bogus high low
    expect(pt!.low).toBeLessThanOrEqual(pt!.close);
  });

  it('coerces negative volume to 0', () => {
    const pt = normalizeHistoryPoint({ ...validRaw, volume: -500 });
    expect(pt!.volume).toBe(0);
  });
});

// ─── normalizeHistory ──────────────────────────────────────────────────────────

describe('normalizeHistory', () => {
  it('drops null rows and sorts by date ascending', () => {
    const raw: RawHistoryPoint[] = [
      { date: '2024-07-03', open: 183, high: 184, low: 182, close: 183, volume: 1_000_000 },
      { date: '2024-07-01', open: 181, high: 182, low: 180, close: 181, volume: 1_000_000 },
      { date: undefined, close: 0, volume: 0 }, // will be dropped
    ];
    const result = normalizeHistory(raw);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2024-07-01');
    expect(result[1].date).toBe('2024-07-03');
  });

  it('returns an empty array for an empty input', () => {
    expect(normalizeHistory([])).toHaveLength(0);
  });
});
