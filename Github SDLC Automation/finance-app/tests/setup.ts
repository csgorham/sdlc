import '@testing-library/jest-dom';

// ─── jsdom polyfills ──────────────────────────────────────────────────────────

// ResizeObserver is used by Recharts' ResponsiveContainer but is not
// implemented in jsdom. Provide a no-op stub so chart components can render
// in the test environment without throwing.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub;
