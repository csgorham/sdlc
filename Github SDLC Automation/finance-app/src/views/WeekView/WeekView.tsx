import { useMarketData } from '@/hooks/useMarketData';
import { PriceChart } from '@/components/PriceChart/PriceChart';
import { LoadingSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { ErrorAlert } from '@/components/ErrorAlert/ErrorAlert';
import { getDisplayName } from '@/services/companyRegistry';
import { colorFor } from '@/utils/chartColors';
import { periodBounds, periodReturnPct } from '@/utils/viewUtils';
import styles from './WeekView.module.css';

export function WeekView() {
  const { data, loading, error, clearError, symbols } = useMarketData();

  const hasData = Object.keys(data).length > 0;
  if (loading && !hasData) return <LoadingSkeleton count={1} />;

  const seriesData = Object.fromEntries(
    symbols.map((s) => [s, data[s]?.history ?? []]),
  );

  // Compute 7-day return per symbol for the summary chips and table
  const returns = symbols
    .filter((s) => data[s])
    .map((s) => {
      const bounds = periodBounds(data[s].history);
      const ret = bounds ? periodReturnPct(bounds.first, bounds.last) : null;
      return { symbol: s, ret, lastPrice: data[s].quote.price };
    })
    .sort((a, b) => (b.ret ?? -Infinity) - (a.ret ?? -Infinity));

  const ibmReturn = returns.find((r) => r.symbol === 'IBM');

  return (
    <div className={styles.root}>
      {error && <ErrorAlert message={error} onDismiss={clearError} />}

      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>7-Day Trend Comparison</h2>
          <p className={styles.sub}>
            Closing price movement · last 7 trading days
            {ibmReturn?.ret !== null && ibmReturn?.ret !== undefined && (
              <span className={ibmReturn.ret >= 0 ? styles.pos : styles.neg}>
                {' '}· IBM {ibmReturn.ret >= 0 ? '+' : ''}{ibmReturn.ret.toFixed(2)}% over period
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Delta chips ── */}
      <div className={styles.chips}>
        {returns.map(({ symbol, ret }) => (
          <div
            key={symbol}
            className={styles.chip}
            style={{ borderColor: colorFor(symbol) }}
          >
            <span className={styles.chipSymbol} style={{ color: colorFor(symbol) }}>
              {symbol}
            </span>
            {ret !== null ? (
              <span className={`${styles.chipRet} ${ret >= 0 ? styles.pos : styles.neg}`}>
                {ret >= 0 ? '+' : ''}{ret.toFixed(2)}%
              </span>
            ) : (
              <span className={styles.chipNoData}>—</span>
            )}
          </div>
        ))}
      </div>

      {/* ── Line chart ── */}
      <PriceChart
        seriesData={seriesData}
        symbols={symbols}
        windowType="7d"
        title="Closing Price — Last 7 Days"
        subtitle="Dashed reference line marks IBM's period-start price"
        height={340}
      />

      {/* ── 7-day change table ── */}
      {returns.length > 0 && (
        <div className={styles.tableWrap}>
          <h3 className={styles.tableTitle}>7-Day Summary</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Company</th>
                <th className={styles.numCol}>Current Price</th>
                <th className={styles.numCol}>7d Return</th>
                <th className={styles.numCol}>vs IBM</th>
              </tr>
            </thead>
            <tbody>
              {returns.map(({ symbol, ret, lastPrice }, i) => {
                const ibmRet = ibmReturn?.ret ?? null;
                const vsIbm = ret !== null && ibmRet !== null ? ret - ibmRet : null;
                return (
                  <tr key={symbol} className={symbol === 'IBM' ? styles.ibmRow : ''}>
                    <td className={styles.rankCell}>{i + 1}</td>
                    <td>
                      <span className={styles.sym} style={{ color: colorFor(symbol) }}>
                        {symbol}
                      </span>
                      <span className={styles.symName}>{getDisplayName(symbol)}</span>
                    </td>
                    <td className={`${styles.numCol} ${styles.priceCell}`}>
                      ${lastPrice.toFixed(2)}
                    </td>
                    <td className={`${styles.numCol} ${ret !== null ? (ret >= 0 ? styles.pos : styles.neg) : ''}`}>
                      {ret !== null
                        ? `${ret >= 0 ? '+' : ''}${ret.toFixed(2)}%`
                        : '—'}
                    </td>
                    <td className={`${styles.numCol} ${vsIbm !== null ? (vsIbm >= 0 ? styles.pos : styles.neg) : ''}`}>
                      {vsIbm !== null && symbol !== 'IBM'
                        ? `${vsIbm >= 0 ? '+' : ''}${vsIbm.toFixed(2)}pp`
                        : symbol === 'IBM' ? '—' : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
