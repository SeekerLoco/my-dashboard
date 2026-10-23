// API route /api/stocks: returns market quotes and recent closes for the Markets card.
// With ?symbols=A,B it returns quotes for just those symbols (Markets symbols or SDLT holdings tickers only).
import { NextResponse, type NextRequest } from 'next/server';
import { HOLDING_TICKERS } from '@/lib/holdings';

// Symbols shown on the Markets card, in display order
const SYMBOLS = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^DJI', name: 'Dow Jones' },
  { symbol: '^IXIC', name: 'Nasdaq' },
  { symbol: 'GC=F', name: 'Gold' },
  { symbol: 'SI=F', name: 'Silver' },
  { symbol: 'SPCX', name: 'SPCX' },
  { symbol: 'CCJ', name: 'CCJ' },
  { symbol: 'NVDA', name: 'NVDA' },
  { symbol: 'TSLA', name: 'TSLA' },
];

// Reads Yahoo Finance chart data for each symbol (cached 15 minutes)
async function fetchQuotes(
  items: { symbol: string; name: string }[],
  withSymbol: boolean,
) {
  const results = [];
  for (const item of items) {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.symbol)}?interval=1d&range=5d`,
        { next: { revalidate: 900 } },
      );
      const data = await res.json();
      const result = data.chart?.result?.[0];
      const meta = result?.meta;
      const closes = result?.indicators?.quote?.[0]?.close || [];

      if (meta?.regularMarketPrice) {
        const price = meta.regularMarketPrice;
        const prev = meta.chartPreviousClose || price;
        const change = price - prev;
        const changePercent = (change / prev) * 100;

        // Clean the closes array (remove nulls) for the sparkline
        const history = closes.filter(
          (c: number | null) => c != null,
        ) as number[];

        results.push({
          ...(withSymbol ? { symbol: item.symbol } : {}),
          name: item.name,
          price,
          change,
          changePercent,
          history,
        });
      }
    } catch (err) {
      console.error(`Failed ${item.symbol}`, err);
    }
  }
  return results;
}

export async function GET(request: NextRequest) {
  const updatedAt = new Date().toISOString();
  const requested = request.nextUrl.searchParams.get('symbols');

  // No ?symbols= : the Markets card list, output unchanged
  if (!requested) {
    return NextResponse.json({
      quotes: await fetchQuotes(SYMBOLS, false),
      updatedAt,
    });
  }

  // Only allow known symbols (or plain stock/ETF tickers like EWZ or BRK.B, used by the tastytrade
  // Alerts panel for option underlyings) so the route can't be used as an open proxy
  const allowed = new Set([
    ...SYMBOLS.map((s) => s.symbol),
    ...HOLDING_TICKERS,
  ]);
  const plainTicker = /^[A-Z]{1,5}(\.[A-Z])?$/;
  const items = [
    ...new Set(requested.split(',').map((s) => s.trim().toUpperCase())),
  ]
    .filter((s) => allowed.has(s) || plainTicker.test(s))
    .map((symbol) => ({ symbol, name: symbol }));
  return NextResponse.json({
    quotes: await fetchQuotes(items, true),
    updatedAt,
  });
}
