import type { HistoricalDataPoint, TimeWindow } from '@/types/finance';
import {
  ResponsiveContainer,
  LineChart,
  AreaChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { formatDateLabel } from '@/utils/dateUtils';
import { colorFor } from '@/utils/chartColors';
import styles from './PriceChart.module.css';

interface ChartDataPoint {
  date: string;
  [symbol: string]: number | string;
}

export interface PriceChartProps {
  /** Map of symbol → history array */
  seriesData: Record<string, HistoricalDataPoint[]>;
  symbols: string[];
  windowType: TimeWindow;
  title: string;
  /** Optional subtitle rendered below the title */
  subtitle?: string;
  /** Height in px — defaults to 320 */
  height?: number;
}

/**
 * Merges per-symbol history arrays into a single flat array of chart data
 * points keyed by date, with one close-price field per symbol.
 */
function buildChartData(
  seriesData: Record<string, HistoricalDataPoint[]>,
  symbols: string[],
): ChartDataPoint[] {
  const dateMap = new Map<string, ChartDataPoint>();

  for (const symbol of symbols) {
    for (const point of seriesData[symbol] ?? []) {
      if (!dateMap.has(point.date)) {
        dateMap.set(point.date, { date: point.date });
      }
      dateMap.get(point.date)![symbol] = point.close;
    }
  }

  return Array.from(dateMap.values()).sort((a, b) =>
    (a.date as string).localeCompare(b.date as string),
  );
}

/** Shared chart axes, grid, tooltip, legend — identical for line and area charts. */
function SharedAxis({ symbols }: { symbols: string[] }) {
  return (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
      <XAxis
        dataKey="date"
        tickFormatter={formatDateLabel}
        tick={{ fontSize: 11, fill: '#8d8d8d' }}
        tickLine={false}
        axisLine={{ stroke: '#e0e0e0' }}
        minTickGap={40}
      />
      <YAxis
        tick={{ fontSize: 11, fill: '#8d8d8d' }}
        tickLine={false}
        axisLine={false}
        tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}`}
        width={58}
      />
      <Tooltip
        formatter={(value: number, name: string) => [
          `$${(value as number).toFixed(2)}`,
          name,
        ]}
        labelFormatter={formatDateLabel}
        contentStyle={{
          border: '1px solid #e0e0e0',
          borderRadius: '6px',
          fontSize: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      />
      <Legend
        wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
        formatter={(value) => (
          <span style={{ color: colorFor(value, symbols.indexOf(value)) }}>
            {value}
          </span>
        )}
      />
    </>
  );
}

export function PriceChart({
  seriesData,
  symbols,
  windowType,
  title,
  subtitle,
  height = 320,
}: PriceChartProps) {
  const chartData = buildChartData(seriesData, symbols);
  const useArea = windowType === 'quarter';

  if (chartData.length === 0) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{title}</h3>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
        <div className={styles.empty}>No historical data available for this time window.</div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.titleRow}>
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        {useArea ? (
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <SharedAxis symbols={symbols} />
            {symbols.map((symbol, i) => (
              <Area
                key={symbol}
                type="monotone"
                dataKey={symbol}
                stroke={colorFor(symbol, i)}
                fill={colorFor(symbol, i)}
                fillOpacity={symbol === 'IBM' ? 0.12 : 0.05}
                strokeWidth={symbol === 'IBM' ? 2.5 : 1.5}
                dot={false}
                connectNulls
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <SharedAxis symbols={symbols} />
            {/* Reference line at IBM's first data point to anchor comparison */}
            {chartData[0]?.IBM !== undefined && (
              <ReferenceLine
                y={chartData[0].IBM as number}
                stroke="#0f62fe"
                strokeDasharray="4 4"
                strokeOpacity={0.35}
              />
            )}
            {symbols.map((symbol, i) => (
              <Line
                key={symbol}
                type="monotone"
                dataKey={symbol}
                stroke={colorFor(symbol, i)}
                strokeWidth={symbol === 'IBM' ? 2.5 : 1.5}
                dot={false}
                connectNulls
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
