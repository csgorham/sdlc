/**
 * FocusedCompanyPanel — renders a quote card and price-history chart for the
 * user-selected symbol from CompanySearch.
 *
 * Returns null when no symbol has been selected, so mounting this component
 * in the layout has zero visual footprint until the user performs a search.
 * Uses only existing building blocks (CompanyCard, PriceChart, LoadingSkeleton,
 * ErrorAlert) — no new third-party dependencies.
 */

import { useDashboardStore } from '@/store/dashboardStore';
import { CompanyCard } from '@/components/CompanyCard/CompanyCard';
import { PriceChart } from '@/components/PriceChart/PriceChart';
import { LoadingSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { ErrorAlert } from '@/components/ErrorAlert/ErrorAlert';
import { colorFor } from '@/utils/chartColors';
import styles from './FocusedCompanyPanel.module.css';

export function FocusedCompanyPanel() {
  const focusedSymbol = useDashboardStore((s) => s.focusedSymbol);
  const focusedData = useDashboardStore((s) => s.focusedData);
  const focusedLoading = useDashboardStore((s) => s.focusedLoading);
  const focusedError = useDashboardStore((s) => s.focusedError);
  const activeWindow = useDashboardStore((s) => s.activeWindow);
  const setFocusedSymbol = useDashboardStore((s) => s.setFocusedSymbol);

  // Nothing selected — render nothing so existing views are undisturbed.
  if (!focusedSymbol) return null;

  return (
    <section className={styles.panel} aria-label={`Focused company: ${focusedSymbol}`}>
      {/* ── Panel header ── */}
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>
          <span
            className={styles.symbolAccent}
            style={{ color: colorFor(focusedSymbol) }}
          >
            {focusedSymbol}
          </span>
          {' '}— Company Focus
        </h2>
        <button
          className={styles.closeBtn}
          type="button"
          onClick={() => void setFocusedSymbol(null)}
          aria-label="Close focused panel"
        >
          ✕ Close
        </button>
      </div>

      {/* ── Loading state ── */}
      {focusedLoading && <LoadingSkeleton count={1} />}

      {/* ── Error state ── */}
      {!focusedLoading && focusedError && (
        <ErrorAlert
          message={focusedError}
          onDismiss={() => void setFocusedSymbol(null)}
        />
      )}

      {/* ── Data state ── */}
      {!focusedLoading && !focusedError && focusedData && (
        <div className={styles.content}>
          {/* Quote summary card */}
          <div className={styles.cardWrap}>
            <CompanyCard quote={focusedData.quote} />
          </div>

          {/* Price-history chart — reuses existing PriceChart with a single symbol */}
          <PriceChart
            seriesData={{ [focusedSymbol]: focusedData.history }}
            symbols={[focusedSymbol]}
            windowType={activeWindow}
            title={`${focusedSymbol} — Closing Price (${activeWindow === 'day' ? 'Today' : activeWindow === '7d' ? 'Last 7 Days' : 'Last Quarter'})`}
            height={280}
          />
        </div>
      )}
    </section>
  );
}
