// SDLT single-stock ("Moon Shot") lots, used by the Moon Shots section on /sdlt/charts.
//
// How to update:
// - Add a buy: append a lot { ticker, account, date: 'YYYY-MM-DD', shares, price } (price per share).
// - Record a sell: append a lot with NEGATIVE shares at the sale price. A ticker whose net shares
//   reach 0 disappears from the chart automatically.
// - Add a new ticker: just add its lots here. Tickers are derived from the lots (net shares > 0),
//   and /api/stocks fetches a price for any ticker listed here, so nothing else needs editing.
// - Remove a ticker entirely: delete its lots.
//
// Cost per lot is shares × price rounded to cents (matches Schwab's per-lot amounts).

export type Lot = {
  ticker: string;
  account: 'Trust' | 'IRA';
  date: string;
  shares: number;
  price: number;
};

export const LOTS: Lot[] = [
  // SPCX - Trust
  {
    ticker: 'SPCX',
    account: 'Trust',
    date: '2026-06-15',
    shares: 1,
    price: 173.13,
  },
  {
    ticker: 'SPCX',
    account: 'Trust',
    date: '2026-06-17',
    shares: 1,
    price: 199.216,
  },
  {
    ticker: 'SPCX',
    account: 'Trust',
    date: '2026-06-18',
    shares: 1,
    price: 181.88,
  },
  {
    ticker: 'SPCX',
    account: 'Trust',
    date: '2026-06-22',
    shares: 1,
    price: 166.0,
  },
  {
    ticker: 'SPCX',
    account: 'Trust',
    date: '2026-06-29',
    shares: 1,
    price: 154.76,
  },
  {
    ticker: 'SPCX',
    account: 'Trust',
    date: '2026-07-15',
    shares: 2,
    price: 135.66,
  },
  {
    ticker: 'SPCX',
    account: 'Trust',
    date: '2026-07-17',
    shares: 1,
    price: 126.07,
  },
  {
    ticker: 'SPCX',
    account: 'Trust',
    date: '2026-07-23',
    shares: 1,
    price: 115.59,
  },
  {
    ticker: 'SPCX',
    account: 'Trust',
    date: '2026-07-27',
    shares: 1,
    price: 113.28,
  },
  {
    ticker: 'SPCX',
    account: 'Trust',
    date: '2026-08-04',
    shares: 2,
    price: 116.25,
  },
  {
    ticker: 'SPCX',
    account: 'Trust',
    date: '2026-08-19',
    shares: 1,
    price: 140.5,
  },
  {
    ticker: 'SPCX',
    account: 'Trust',
    date: '2026-09-15',
    shares: 1,
    price: 144.925,
  },
  // SPCX - IRA
  {
    ticker: 'SPCX',
    account: 'IRA',
    date: '2026-06-15',
    shares: 1,
    price: 172.75,
  },
  {
    ticker: 'SPCX',
    account: 'IRA',
    date: '2026-06-17',
    shares: 1,
    price: 198.7,
  },
  {
    ticker: 'SPCX',
    account: 'IRA',
    date: '2026-06-18',
    shares: 1,
    price: 181.35,
  },
  {
    ticker: 'SPCX',
    account: 'IRA',
    date: '2026-06-22',
    shares: 1,
    price: 166.0,
  },
  {
    ticker: 'SPCX',
    account: 'IRA',
    date: '2026-06-29',
    shares: 1,
    price: 154.88,
  },
  {
    ticker: 'SPCX',
    account: 'IRA',
    date: '2026-07-15',
    shares: 2,
    price: 135.625,
  },
  {
    ticker: 'SPCX',
    account: 'IRA',
    date: '2026-07-17',
    shares: 1,
    price: 125.31,
  },
  {
    ticker: 'SPCX',
    account: 'IRA',
    date: '2026-07-23',
    shares: 1,
    price: 115.12,
  },
  {
    ticker: 'SPCX',
    account: 'IRA',
    date: '2026-07-27',
    shares: 1,
    price: 112.785,
  },
  // NVDA - Trust
  {
    ticker: 'NVDA',
    account: 'Trust',
    date: '2026-10-16',
    shares: 3,
    price: 215.97,
  },
  // CCJ - Trust
  {
    ticker: 'CCJ',
    account: 'Trust',
    date: '2026-10-16',
    shares: 9,
    price: 81.345,
  },
];

// Lot amount in dollars, rounded half-up to cents (integer math avoids float errors like 144.925 → 144.92).
export function lotCost(lot: Lot): number {
  return Math.round(Math.round(lot.shares * lot.price * 1e6) / 1e4) / 100;
}

export type Position = { ticker: string; shares: number; cost: number };

// Combined (Trust + IRA) position per ticker, keeping only tickers with net shares > 0.
// Sells (negative shares) reduce cost basis at the average cost per share.
export function getPositions(lots: Lot[] = LOTS): Position[] {
  const map = new Map<string, Position>();
  [...lots]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((lot) => {
      const p = map.get(lot.ticker) ?? {
        ticker: lot.ticker,
        shares: 0,
        cost: 0,
      };
      if (lot.shares >= 0) {
        p.cost += lotCost(lot);
      } else if (p.shares > 0) {
        p.cost += (p.cost / p.shares) * lot.shares;
      }
      p.shares += lot.shares;
      map.set(lot.ticker, p);
    });
  return [...map.values()]
    .filter((p) => p.shares > 0)
    .map((p) => ({ ...p, cost: Math.round(p.cost * 100) / 100 }));
}

// All tickers that appear in the lots (used by /api/stocks to know what to fetch).
export const HOLDING_TICKERS = [...new Set(LOTS.map((l) => l.ticker))];
