import { NextResponse } from 'next/server';

const SYMBOLS = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^DJI', name: 'Dow Jones' },
  { symbol: '^IXIC', name: 'Nasdaq' },
  { symbol: 'GC=F', name: 'Gold' },
  { symbol: 'SI=F', name: 'Silver' },
  { symbol: 'SPCX', name: 'SPCX' },
];

export async function GET() {
  const results = [];

  for (const item of SYMBOLS) {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.symbol)}?interval=1d&range=1d`,
        { next: { revalidate: 900 } } // cache for 15 minutes
      );
      const data = await res.json();
      const meta = data.chart?.result?.[0]?.meta;

      if (meta?.regularMarketPrice) {
        const price = meta.regularMarketPrice;
        const prev = meta.chartPreviousClose || price;
        const change = price - prev;
        const changePercent = (change / prev) * 100;

        results.push({
          name: item.name,
          price,
          change,
          changePercent,
        });
      }
    } catch (err) {
      console.error(`Failed ${item.symbol}`, err);
    }
  }

  return NextResponse.json(results);
}