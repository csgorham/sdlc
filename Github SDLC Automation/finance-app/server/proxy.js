/**
 * Yahoo Finance proxy server — solves CORS for browser-side data fetching.
 *
 * Usage:
 *   node server/proxy.js
 *
 * Endpoints:
 *   GET  /api/finance/quote/:symbol
 *   GET  /api/finance/history/:symbol?start=YYYY-MM-DD&end=YYYY-MM-DD
 *   POST /api/finance/batch          body: { symbols: string[] }
 *
 * The batch endpoint fetches all requested quotes in parallel server-side,
 * reducing the browser's round-trips from N to 1.
 *
 * Requires the optional dependencies: express, cors, yahoo-finance2
 *   npm install express cors yahoo-finance2
 */

import express from 'express';
import cors from 'cors';

// yahoo-finance2 is an optional dependency; provide a clear error if missing.
let yf;
try {
  const mod = await import('yahoo-finance2');
  yf = mod.default;
} catch {
  console.error(
    '[proxy] yahoo-finance2 is not installed.\n' +
    'Run: npm install yahoo-finance2\n' +
    'Or set VITE_USE_MOCK=true to use mock data instead.',
  );
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PROXY_PORT ?? 3001;

// ─── Shared mapping helpers ────────────────────────────────────────────────────

/**
 * Maps a yahoo-finance2 `price` module result to the RawQuote wire shape
 * expected by the browser's normalizeQuote function.
 */
function mapQuote(p) {
  return {
    symbol:           p.symbol,
    name:             p.longName ?? p.shortName ?? p.symbol,
    price:            p.regularMarketPrice ?? 0,
    change:           p.regularMarketChange ?? 0,
    // yahoo-finance2 returns changePercent as a decimal fraction (e.g. 0.0068)
    changePercent:    p.regularMarketChangePercent ?? 0,
    previousClose:    p.regularMarketPreviousClose ?? 0,
    dayHigh:          p.regularMarketDayHigh ?? 0,
    dayLow:           p.regularMarketDayLow ?? 0,
    fiftyTwoWeekHigh: p.fiftyTwoWeekHigh ?? undefined,
    fiftyTwoWeekLow:  p.fiftyTwoWeekLow  ?? undefined,
    peRatio:          p.trailingPE ?? undefined,
    volume:           p.regularMarketVolume ?? 0,
    marketCap:        p.marketCap ?? undefined,
    currency:         p.currency ?? 'USD',
    marketState:      p.marketState ?? 'CLOSED',
  };
}

// ─── GET /api/finance/quote/:symbol ───────────────────────────────────────────

app.get('/api/finance/quote/:symbol', async (req, res) => {
  const { symbol } = req.params;
  try {
    const result = await yf.quoteSummary(symbol.toUpperCase(), {
      modules: ['price'],
    });
    res.json(mapQuote(result.price));
  } catch (err) {
    const status = /Not Found|No fundamentals/i.test(err?.message) ? 404 : 500;
    res.status(status).json({ error: err?.message ?? 'Unknown error' });
  }
});

// ─── GET /api/finance/history/:symbol ─────────────────────────────────────────

app.get('/api/finance/history/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const { start, end } = req.query;

  if (!start || !end) {
    return res
      .status(400)
      .json({ error: 'start and end query params are required' });
  }

  try {
    const result = await yf.historical(symbol.toUpperCase(), {
      period1: String(start),
      period2: String(end),
      interval: '1d',
    });

    const mapped = result.map((d) => ({
      date:     d.date instanceof Date ? d.date.toISOString().slice(0, 10) : d.date,
      open:     d.open     ?? 0,
      high:     d.high     ?? 0,
      low:      d.low      ?? 0,
      close:    d.close    ?? 0,
      adjClose: d.adjClose ?? d.close ?? 0,
      volume:   d.volume   ?? 0,
    }));

    res.json(mapped);
  } catch (err) {
    const status = /Not Found|No fundamentals/i.test(err?.message) ? 404 : 500;
    res.status(status).json({ error: err?.message ?? 'Unknown error' });
  }
});

// ─── POST /api/finance/batch ──────────────────────────────────────────────────
// Body: { symbols: string[] }
// Response: Record<string, RawQuote | { error: string }>
//
// Fetches all requested symbols in parallel server-side.
// Per-symbol failures are returned as { error: string } entries rather than
// failing the entire batch, allowing the UI to display partial results.

app.post('/api/finance/batch', async (req, res) => {
  const symbols = req.body?.symbols;
  if (!Array.isArray(symbols) || symbols.length === 0) {
    return res.status(400).json({ error: '`symbols` array is required in the request body' });
  }
  if (symbols.length > 20) {
    return res.status(400).json({ error: 'Batch size limited to 20 symbols per request' });
  }

  const results = await Promise.allSettled(
    symbols.map(async (sym) => {
      const result = await yf.quoteSummary(String(sym).toUpperCase(), {
        modules: ['price'],
      });
      return { symbol: String(sym).toUpperCase(), quote: mapQuote(result.price) };
    }),
  );

  // Build response in input order, pairing fulfilled/rejected by index.
  const ordered = {};
  symbols.forEach((sym, i) => {
    const upSym = String(sym).toUpperCase();
    const r = results[i];
    if (r.status === 'fulfilled') {
      ordered[upSym] = r.value.quote;
    } else {
      ordered[upSym] = { error: r.reason?.message ?? 'Failed to fetch' };
    }
  });

  res.json(ordered);
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[proxy] Yahoo Finance proxy running on http://localhost:${PORT}`);
  console.log(`[proxy] Endpoints:`);
  console.log(`[proxy]   GET  /api/finance/quote/:symbol`);
  console.log(`[proxy]   GET  /api/finance/history/:symbol?start=YYYY-MM-DD&end=YYYY-MM-DD`);
  console.log(`[proxy]   POST /api/finance/batch  { symbols: string[] }`);
});
