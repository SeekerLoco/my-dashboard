// API route /api/stocks: returns market quotes and recent closes for the Markets card.
import { NextResponse } from 'next/server';

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
];

// Reads Yahoo Finance chart data for each symbol (cached 15 minutes)
export async function GET() {
  const results = [];
  const updatedAt = new Date().toISOString();

  for (const item of SYMBOLS) {
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

  return NextResponse.json({ quotes: results, updatedAt });
}
