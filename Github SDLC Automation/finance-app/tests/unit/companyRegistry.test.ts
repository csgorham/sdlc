import { describe, it, expect } from 'vitest';
import {
  COMPANY_REGISTRY,
  getCompanyProfile,
  getDisplayName,
  getAllSymbols,
  isKnownSymbol,
} from '@/services/companyRegistry';
import { DEFAULT_SYMBOLS } from '@/types/finance';

describe('COMPANY_REGISTRY', () => {
  it('contains all DEFAULT_SYMBOLS', () => {
    for (const sym of DEFAULT_SYMBOLS) {
      expect(COMPANY_REGISTRY[sym]).toBeDefined();
    }
  });

  it('every entry has required fields', () => {
    for (const profile of Object.values(COMPANY_REGISTRY)) {
      expect(profile.symbol).toBeTruthy();
      expect(profile.displayName).toBeTruthy();
      expect(profile.description).toBeTruthy();
      expect(profile.sector).toBeTruthy();
      expect(profile.exchange).toBeTruthy();
    }
  });

  it('symbol keys are uppercase', () => {
    for (const key of Object.keys(COMPANY_REGISTRY)) {
      expect(key).toBe(key.toUpperCase());
    }
  });
});

describe('getCompanyProfile', () => {
  it('returns profile for known symbol', () => {
    const profile = getCompanyProfile('IBM');
    expect(profile?.symbol).toBe('IBM');
  });

  it('is case-insensitive', () => {
    expect(getCompanyProfile('ibm')?.symbol).toBe('IBM');
    expect(getCompanyProfile('Msft')?.symbol).toBe('MSFT');
  });

  it('returns undefined for unknown symbol', () => {
    expect(getCompanyProfile('UNKNOWN_XYZ')).toBeUndefined();
  });
});

describe('getDisplayName', () => {
  it('returns registry display name for known symbol', () => {
    expect(getDisplayName('IBM')).toBe('IBM');
    expect(getDisplayName('MSFT')).toBe('Microsoft');
  });

  it('returns uppercased symbol for unknown symbol', () => {
    expect(getDisplayName('xyz')).toBe('XYZ');
  });
});

describe('getAllSymbols', () => {
  it('returns an array of all registry symbols', () => {
    const symbols = getAllSymbols();
    expect(symbols).toContain('IBM');
    expect(symbols).toContain('MSFT');
    expect(symbols.length).toBeGreaterThanOrEqual(5);
  });
});

describe('isKnownSymbol', () => {
  it('returns true for registered symbols', () => {
    expect(isKnownSymbol('IBM')).toBe(true);
    expect(isKnownSymbol('crm')).toBe(true);
  });

  it('returns false for unregistered symbols', () => {
    expect(isKnownSymbol('FAKE')).toBe(false);
  });
});
