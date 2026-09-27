/**
 * Pure date-range utilities used by the data service layer.
 * All functions return ISO-8601 date strings (YYYY-MM-DD).
 */

/**
 * Returns today's date as an ISO-8601 string.
 */
export function today(): string {
  return toISODate(new Date());
}

/**
 * Returns the date N calendar days before today as an ISO-8601 string.
 */
export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

/**
 * Returns the start date for a given time window.
 *   'day'     → today (same as today())
 *   '7d'      → 7 calendar days ago
 *   'quarter' → 90 calendar days ago (~1 quarter)
 */
export function windowStartDate(window: '7d' | 'quarter'): string {
  return window === '7d' ? daysAgo(7) : daysAgo(90);
}

/**
 * Formats a Date object as YYYY-MM-DD.
 */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string into a short display label.
 * e.g. "2024-07-01" → "Jul 1"
 */
export function formatDateLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
