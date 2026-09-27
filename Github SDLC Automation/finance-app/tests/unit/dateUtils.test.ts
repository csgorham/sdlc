import { describe, it, expect } from 'vitest';
import { toISODate, daysAgo, windowStartDate, formatDateLabel } from '@/utils/dateUtils';

describe('toISODate', () => {
  it('formats a Date as YYYY-MM-DD', () => {
    expect(toISODate(new Date('2024-07-15T12:00:00Z'))).toBe('2024-07-15');
  });
});

describe('daysAgo', () => {
  it('returns a date string in the past', () => {
    const result = daysAgo(7);
    const today = new Date();
    const expected = new Date(today);
    expected.setDate(today.getDate() - 7);
    expect(result).toBe(toISODate(expected));
  });
});

describe('windowStartDate', () => {
  it('returns 7 days ago for 7d window', () => {
    expect(windowStartDate('7d')).toBe(daysAgo(7));
  });

  it('returns 90 days ago for quarter window', () => {
    expect(windowStartDate('quarter')).toBe(daysAgo(90));
  });
});

describe('formatDateLabel', () => {
  it('formats an ISO date as a short readable label', () => {
    const label = formatDateLabel('2024-07-01');
    expect(label).toMatch(/Jul/);
    expect(label).toMatch(/1/);
  });
});
