/**
 * financeService — selects the active FinanceAdapter based on VITE_USE_MOCK.
 *
 * All application code imports from this module, never from an adapter directly.
 * Switching data sources requires only a .env change, not a code change.
 */

import type { FinanceAdapter } from './financeAdapter';
import { mockFinanceAdapter } from './mockFinanceAdapter';
import { yahooFinanceAdapter } from './yahooFinanceAdapter';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export const financeService: FinanceAdapter = useMock
  ? mockFinanceAdapter
  : yahooFinanceAdapter;
