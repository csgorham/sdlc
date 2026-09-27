/**
 * companyRegistry — the single source of truth for tracked companies.
 *
 * To add a new company:
 *   1. Add an entry to COMPANY_REGISTRY below.
 *   2. Add its mock quote and history seed to mockData.ts.
 *   That is all — no other file needs changing.
 *
 * The registry provides static metadata that is always available, even before
 * live data is fetched. The UI uses it for display names, sector labels, and
 * colour-stable ordering.
 */

import type { CompanyProfile } from '@/types/finance';

// ─── Registry ─────────────────────────────────────────────────────────────────

export const COMPANY_REGISTRY: Record<string, CompanyProfile> = {
  IBM: {
    symbol: 'IBM',
    displayName: 'IBM',
    description:
      'International Business Machines — enterprise hybrid cloud, AI, and consulting services.',
    sector: 'Information Technology',
    exchange: 'NYSE',
  },
  MSFT: {
    symbol: 'MSFT',
    displayName: 'Microsoft',
    description:
      'Microsoft Corporation — cloud computing (Azure), productivity software, and gaming.',
    sector: 'Information Technology',
    exchange: 'NASDAQ',
  },
  ORCL: {
    symbol: 'ORCL',
    displayName: 'Oracle',
    description:
      'Oracle Corporation — cloud applications, database technologies, and enterprise software.',
    sector: 'Information Technology',
    exchange: 'NYSE',
  },
  SAP: {
    symbol: 'SAP',
    displayName: 'SAP',
    description:
      'SAP SE — enterprise resource planning (ERP) and business management software.',
    sector: 'Information Technology',
    exchange: 'NYSE',
  },
  CRM: {
    symbol: 'CRM',
    displayName: 'Salesforce',
    description:
      'Salesforce Inc. — customer relationship management (CRM) and cloud-based enterprise software.',
    sector: 'Information Technology',
    exchange: 'NYSE',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the CompanyProfile for a symbol, or undefined if not registered.
 * Symbol lookup is case-insensitive.
 */
export function getCompanyProfile(symbol: string): CompanyProfile | undefined {
  return COMPANY_REGISTRY[symbol.toUpperCase()];
}

/**
 * Returns the display name for a symbol.
 * Falls back to the raw symbol string if not in the registry.
 */
export function getDisplayName(symbol: string): string {
  return COMPANY_REGISTRY[symbol.toUpperCase()]?.displayName ?? symbol.toUpperCase();
}

/**
 * Returns all registered symbols in insertion order.
 */
export function getAllSymbols(): string[] {
  return Object.keys(COMPANY_REGISTRY);
}

/**
 * Returns true if the symbol is present in the registry.
 */
export function isKnownSymbol(symbol: string): boolean {
  return symbol.toUpperCase() in COMPANY_REGISTRY;
}
