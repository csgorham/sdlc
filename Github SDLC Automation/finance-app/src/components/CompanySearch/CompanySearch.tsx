/**
 * CompanySearch — header input that lets the user look up any ticker symbol
 * and trigger a focused graph below the main dashboard views.
 *
 * Keeps a local draft string so the store is only updated on a valid submit,
 * not on every keystroke. Validation ensures the symbol is 1–5 uppercase
 * letters before any network call is made.
 */

import { useState, type KeyboardEvent, type FormEvent } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import styles from './CompanySearch.module.css';

/** Returns an error message for an invalid ticker, or null when valid. */
function validateTicker(value: string): string | null {
  const trimmed = value.trim().toUpperCase();
  if (trimmed.length === 0) return 'Enter a ticker symbol.';
  if (!/^[A-Z]{1,5}$/.test(trimmed)) return 'Use 1–5 letters (e.g. AAPL).';
  return null;
}

export function CompanySearch() {
  const focusedSymbol = useDashboardStore((s) => s.focusedSymbol);
  const focusedLoading = useDashboardStore((s) => s.focusedLoading);
  const setFocusedSymbol = useDashboardStore((s) => s.setFocusedSymbol);

  const [draft, setDraft] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const error = validateTicker(draft);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    void setFocusedSymbol(draft.trim().toUpperCase());
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleSubmit(e as unknown as FormEvent);
    }
  }

  function handleClear() {
    setDraft('');
    setValidationError(null);
    void setFocusedSymbol(null);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} role="search" aria-label="Company search">
      <div className={styles.inputRow}>
        <input
          className={`${styles.input} ${validationError ? styles.inputError : ''}`}
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (validationError) setValidationError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ticker, e.g. AAPL"
          maxLength={5}
          aria-label="Ticker symbol"
          aria-describedby={validationError ? 'search-error' : undefined}
          spellCheck={false}
          autoComplete="off"
        />
        <button
          className={styles.searchBtn}
          type="submit"
          disabled={focusedLoading}
          aria-label="Search"
        >
          {focusedLoading ? '…' : 'Go'}
        </button>
        {focusedSymbol && !focusedLoading && (
          <button
            className={styles.clearBtn}
            type="button"
            onClick={handleClear}
            aria-label="Clear focused company"
          >
            ✕
          </button>
        )}
      </div>
      {validationError && (
        <span id="search-error" className={styles.errorMsg} role="alert">
          {validationError}
        </span>
      )}
    </form>
  );
}
