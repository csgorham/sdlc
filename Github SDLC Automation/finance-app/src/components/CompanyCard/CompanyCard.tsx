import type { QuoteSummary } from '@/types/finance';
import { colorFor } from '@/utils/chartColors';
import { formatMarketCap } from '@/utils/viewUtils';
import styles from './CompanyCard.module.css';

interface CompanyCardProps {
  quote: QuoteSummary;
  /** Highlights this card with a left accent stripe (used for IBM) */
  primary?: boolean;
}

export function CompanyCard({ quote, primary = false }: CompanyCardProps) {
  const isPositive = quote.change >= 0;
  const sign = isPositive ? '+' : '';
  const accentColor = colorFor(quote.symbol);

  // 52-week position as percentage along the low→high range
  const has52w = quote.fiftyTwoWeekHigh != null && quote.fiftyTwoWeekLow != null;
  const range52w = has52w ? quote.fiftyTwoWeekHigh! - quote.fiftyTwoWeekLow! : 0;
  const pos52w = has52w && range52w > 0
    ? Math.round(((quote.price - quote.fiftyTwoWeekLow!) / range52w) * 100)
    : null;

  return (
    <div
      className={`${styles.card} ${primary ? styles.primary : ''}`}
      style={primary ? { '--accent': accentColor } as React.CSSProperties : undefined}
    >
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.symbolRow}>
          <span className={styles.symbol} style={{ color: accentColor }}>
            {quote.symbol}
          </span>
          <span
            className={`${styles.badge} ${
              quote.marketState === 'REGULAR' ? styles.open :
              quote.marketState === 'PRE'     ? styles.pre  : styles.closed
            }`}
          >
            {quote.marketState === 'REGULAR' ? 'Open' : quote.marketState}
          </span>
        </div>
        <span className={styles.name}>{quote.name}</span>
      </div>

      {/* ── Price ── */}
      <div className={styles.priceRow}>
        <span className={styles.price}>
          {quote.currency}&nbsp;{quote.price.toFixed(2)}
        </span>
        <span className={`${styles.change} ${isPositive ? styles.positive : styles.negative}`}>
          {sign}{quote.change.toFixed(2)}&nbsp;
          <span className={styles.changePct}>({sign}{quote.changePercent.toFixed(2)}%)</span>
        </span>
      </div>

      {/* ── Day range ── */}
      <div className={styles.rangeRow}>
        <span className={styles.rangeLabel}>Day range</span>
        <span className={styles.rangeValues}>
          {quote.dayLow.toFixed(2)} – {quote.dayHigh.toFixed(2)}
        </span>
      </div>

      {/* ── 52-week bar ── */}
      {has52w && pos52w !== null && (
        <div className={styles.weekRange}>
          <div className={styles.weekRangeBar}>
            <div
              className={styles.weekRangeThumb}
              style={{ left: `${pos52w}%`, background: accentColor }}
            />
          </div>
          <div className={styles.weekRangeLabels}>
            <span>{quote.fiftyTwoWeekLow!.toFixed(0)}</span>
            <span className={styles.weekRangeCenter}>{pos52w}% of 52w</span>
            <span>{quote.fiftyTwoWeekHigh!.toFixed(0)}</span>
          </div>
        </div>
      )}

      {/* ── Footer stats ── */}
      <div className={styles.footer}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Vol</span>
          <span className={styles.statValue}>
            {(quote.volume / 1_000_000).toFixed(1)}M
          </span>
        </div>
        {quote.marketCap && (
          <div className={styles.stat}>
            <span className={styles.statLabel}>Mkt Cap</span>
            <span className={styles.statValue}>{formatMarketCap(quote.marketCap)}</span>
          </div>
        )}
        {quote.peRatio && (
          <div className={styles.stat}>
            <span className={styles.statLabel}>P/E</span>
            <span className={styles.statValue}>{quote.peRatio.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
