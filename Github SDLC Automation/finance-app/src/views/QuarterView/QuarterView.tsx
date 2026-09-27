import { useMarketData } from '@/hooks/useMarketData';
import { PriceChart } from '@/components/PriceChart/PriceChart';
import { LoadingSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { ErrorAlert } from '@/components/ErrorAlert/ErrorAlert';
import { getDisplayName } from '@/services/companyRegistry';
import { colorFor } from '@/utils/chartColors';
import { computePeriodStats } from '@/utils/viewUtils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';
import styles from './QuarterView.module.css';

export function QuarterView() {
  const { data, loading, error, clearError, symbols } = useMarketData();

  const hasData = Object.keys(data).length > 0;
  if (loading && !hasData) return <LoadingSkeleton count={1} />;

  const seriesData = Object.fromEntries(
    symbols.map((s) => [s, data[s]?.history ?? []]),
  );

  const stats = computePeriodStats(symbols, data);
  const ibmStat = stats.find((s) => s.symbol === 'IBM');

  // Bar chart data: % return from period start, sorted best → worst
  const barData = stats.map((s) => ({
    symbol: s.symbol,
    return: parseFloat(s.returnPct.toFixed(2)),
  }));

  return (
    <div className={styles.root}>
      {error && <ErrorAlert message={error} onDismiss={clearError} />}

      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Last Quarter Comparison</h2>
          <p className={styles.sub}>
            ~90 days of price history · area chart + % return from period start
            {ibmStat && (
              <span className={ibmStat.returnPct >= 0 ? styles.pos : styles.neg}>
                {' '}· IBM {ibmStat.returnPct >= 0 ? '+' : ''}
                {ibmStat.returnPct.toFixed(2)}% quarter return
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── % Return bar chart ── */}
      {barData.length > 0 && (
        <div className={styles.barCard}>
          <h3 className={styles.panelTitle}>
            Total Return from Period Start (%)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={barData}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
              barSize={36}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="symbol"
                tick={{ fontSize: 12, fontWeight: 600 }}
                tickLine={false}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <YAxis
                tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`}
                tick={{ fontSize: 11, fill: '#8d8d8d' }}
                tickLine={false}
                axisLine={false}
                width={56}
              />
              <Tooltip
                formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toFixed(2)}%`, 'Return']}
                contentStyle={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              />
              <ReferenceLine y={0} stroke="#c6c6c6" strokeWidth={1} />
              <Bar dataKey="return" radius={[4, 4, 0, 0]}>
                {barData.map((entry) => (
                  <Cell
                    key={entry.symbol}
                    fill={colorFor(entry.symbol)}
                    fillOpacity={entry.return >= 0 ? 0.85 : 0.65}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Area chart ── */}
      <PriceChart
        seriesData={seriesData}
        symbols={symbols}
        windowType="quarter"
        title="Closing Price — Last Quarter"
        subtitle="IBM shaded area is more prominent for reference"
        height={340}
      />

      {/* ── Period stats table ── */}
      {stats.length > 0 && (
        <div className={styles.tableWrap}>
          <h3 className={styles.tableTitle}>Quarter Period Stats</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Company</th>
                <th className={styles.numCol}>Start</th>
                <th className={styles.numCol}>End</th>
                <th className={styles.numCol}>Period High</th>
                <th className={styles.numCol}>Period Low</th>
                <th className={styles.numCol}>Return</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr key={s.symbol} className={s.symbol === 'IBM' ? styles.ibmRow : ''}>
                  <td className={styles.rankCell}>{i + 1}</td>
                  <td>
                    <span className={styles.sym} style={{ color: colorFor(s.symbol) }}>
                      {s.symbol}
                    </span>
                    <span className={styles.symName}>{getDisplayName(s.symbol)}</span>
                  </td>
                  <td className={`${styles.numCol} ${styles.mono}`}>
                    ${s.startPrice.toFixed(2)}
                  </td>
                  <td className={`${styles.numCol} ${styles.mono}`}>
                    ${s.endPrice.toFixed(2)}
                  </td>
                  <td className={`${styles.numCol} ${styles.mono} ${styles.highCol}`}>
                    ${s.high.toFixed(2)}
                  </td>
                  <td className={`${styles.numCol} ${styles.mono} ${styles.lowCol}`}>
                    ${s.low.toFixed(2)}
                  </td>
                  <td className={`${styles.numCol} ${s.returnPct >= 0 ? styles.pos : styles.neg}`}>
                    <span
                      className={styles.retBadge}
                      style={{
                        background: s.returnPct >= 0 ? '#defbe6' : '#fff1f1',
                        color:      s.returnPct >= 0 ? '#198038' : '#da1e28',
                      }}
                    >
                      {s.returnPct >= 0 ? '+' : ''}{s.returnPct.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
