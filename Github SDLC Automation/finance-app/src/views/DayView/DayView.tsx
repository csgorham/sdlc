import { useMarketData } from '@/hooks/useMarketData';
import { CompanyCard } from '@/components/CompanyCard/CompanyCard';
import { LoadingSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { ErrorAlert } from '@/components/ErrorAlert/ErrorAlert';
import { getDisplayName } from '@/services/companyRegistry';
import { colorFor } from '@/utils/chartColors';
import { formatTimestamp } from '@/utils/viewUtils';
import styles from './DayView.module.css';

export function DayView() {
  const { data, loading, error, clearError, symbols } = useMarketData();

  const hasData = Object.keys(data).length > 0;

  if (loading && !hasData) {
    return <LoadingSkeleton count={symbols.length} />;
  }

  // Rank companies by % change for the leaderboard
  const ranked = symbols
    .filter((s) => data[s])
    .map((s) => data[s].quote)
    .sort((a, b) => b.changePercent - a.changePercent);

  const ibmData = data['IBM'];

  return (
    <div className={styles.root}>
      {error && <ErrorAlert message={error} onDismiss={clearError} />}

      {/* ── Section header ── */}
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Today's Market Summary</h2>
          <p className={styles.sectionSub}>
            {symbols.length} companies · IBM and key enterprise software competitors
            {ibmData && (
              <span className={styles.updatedAt}>
                {' '}· Updated {formatTimestamp(ibmData.lastUpdated)}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Company cards ── */}
      <div className={styles.cardGrid}>
        {symbols.map((symbol) => {
          const entry = data[symbol];
          if (!entry) return null;
          return (
            <CompanyCard
              key={symbol}
              quote={entry.quote}
              primary={symbol === 'IBM'}
            />
          );
        })}
      </div>

      {/* ── Bottom panels: IBM spotlight + ranking ── */}
      <div className={styles.panels}>

        {/* IBM spotlight */}
        {ibmData && (
          <div className={styles.spotlight}>
            <h3 className={styles.panelTitle}>
              <span style={{ color: colorFor('IBM') }}>IBM</span> Spotlight
            </h3>
            <div className={styles.spotlightGrid}>
              <div className={styles.spotlightStat}>
                <span className={styles.spotlightLabel}>Price</span>
                <span className={styles.spotlightValue}>
                  ${ibmData.quote.price.toFixed(2)}
                </span>
              </div>
              <div className={styles.spotlightStat}>
                <span className={styles.spotlightLabel}>Day Change</span>
                <span className={`${styles.spotlightValue} ${ibmData.quote.change >= 0 ? styles.pos : styles.neg}`}>
                  {ibmData.quote.change >= 0 ? '+' : ''}
                  {ibmData.quote.change.toFixed(2)} ({ibmData.quote.changePercent.toFixed(2)}%)
                </span>
              </div>
              <div className={styles.spotlightStat}>
                <span className={styles.spotlightLabel}>Prev Close</span>
                <span className={styles.spotlightValue}>
                  ${ibmData.quote.previousClose.toFixed(2)}
                </span>
              </div>
              {ibmData.quote.marketCap && (
                <div className={styles.spotlightStat}>
                  <span className={styles.spotlightLabel}>Market Cap</span>
                  <span className={styles.spotlightValue}>
                    ${(ibmData.quote.marketCap / 1e9).toFixed(1)}B
                  </span>
                </div>
              )}
              {ibmData.quote.fiftyTwoWeekHigh && (
                <div className={styles.spotlightStat}>
                  <span className={styles.spotlightLabel}>52w High</span>
                  <span className={styles.spotlightValue}>
                    ${ibmData.quote.fiftyTwoWeekHigh.toFixed(2)}
                  </span>
                </div>
              )}
              {ibmData.quote.fiftyTwoWeekLow && (
                <div className={styles.spotlightStat}>
                  <span className={styles.spotlightLabel}>52w Low</span>
                  <span className={styles.spotlightValue}>
                    ${ibmData.quote.fiftyTwoWeekLow.toFixed(2)}
                  </span>
                </div>
              )}
              {ibmData.quote.peRatio && (
                <div className={styles.spotlightStat}>
                  <span className={styles.spotlightLabel}>P/E Ratio</span>
                  <span className={styles.spotlightValue}>
                    {ibmData.quote.peRatio.toFixed(1)}x
                  </span>
                </div>
              )}
              <div className={styles.spotlightStat}>
                <span className={styles.spotlightLabel}>Volume</span>
                <span className={styles.spotlightValue}>
                  {(ibmData.quote.volume / 1_000_000).toFixed(2)}M
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Daily performance ranking */}
        {ranked.length > 0 && (
          <div className={styles.ranking}>
            <h3 className={styles.panelTitle}>Daily Performance Ranking</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Company</th>
                  <th className={styles.numCol}>Price</th>
                  <th className={styles.numCol}>Change</th>
                  <th className={styles.numCol}>% Change</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((q, i) => (
                  <tr key={q.symbol} className={q.symbol === 'IBM' ? styles.ibmRow : ''}>
                    <td className={styles.rank}>{i + 1}</td>
                    <td>
                      <span
                        className={styles.rankSymbol}
                        style={{ color: colorFor(q.symbol) }}
                      >
                        {q.symbol}
                      </span>
                      <span className={styles.rankName}>{getDisplayName(q.symbol)}</span>
                    </td>
                    <td className={`${styles.numCol} ${styles.rankPrice}`}>
                      ${q.price.toFixed(2)}
                    </td>
                    <td className={`${styles.numCol} ${q.change >= 0 ? styles.pos : styles.neg}`}>
                      {q.change >= 0 ? '+' : ''}{q.change.toFixed(2)}
                    </td>
                    <td className={`${styles.numCol} ${q.changePercent >= 0 ? styles.pos : styles.neg}`}>
                      <span className={styles.pctBadge} style={{
                        background: q.changePercent >= 0 ? '#defbe6' : '#fff1f1',
                        color:      q.changePercent >= 0 ? '#198038' : '#da1e28',
                      }}>
                        {q.changePercent >= 0 ? '+' : ''}{q.changePercent.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
