// Markets card: index/commodity quotes with sparklines, refreshed every 2 hours.
'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import IconButton from '@/components/IconButton';
import Sparkline from '@/components/charts/Sparkline';

type StockQuote = {
  name: string;
  price: number;
  change: number;
  changePercent: number;
  history: number[];
};

export default function MarketsCard() {
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [stocksUpdatedAt, setStocksUpdatedAt] = useState<string | null>(null);

  // Reads our own API route /api/stocks (which pulls from Yahoo Finance)
  async function fetchStocks() {
    try {
      const res = await fetch('/api/stocks');
      const data = await res.json();
      setStocks(data.quotes);
      setStocksUpdatedAt(data.updatedAt);
    } catch (err) {
      console.error('Failed to load stocks', err);
    }
  }

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 120 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <div className="flex justify-between items-center mb-3">
        <a
          href="https://finviz.com/futures"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold hover:underline"
        >
          Markets
        </a>
        <IconButton onClick={fetchStocks} title="Refresh">
          🔄
        </IconButton>
      </div>

      {stocks.length === 0 ? (
        <div className="text-sm opacity-70">Loading...</div>
      ) : (
        <div className="space-y-2 text-sm">
          {stocks.map((s) => (
            <div key={s.name} className="flex justify-between items-center">
              <span className="font-medium">{s.name}</span>
              <div className="flex items-center">
                <div className="text-right">
                  <div>
                    {s.price.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div
                    className={
                      s.change >= 0 ? 'text-green-400' : 'text-red-400'
                    }
                  >
                    {s.change >= 0 ? '+' : ''}
                    {s.change.toFixed(2)} ({s.changePercent.toFixed(2)}%)
                  </div>
                </div>
                <Sparkline data={s.history} positive={s.change >= 0} />
              </div>
            </div>
          ))}
        </div>
      )}

      {stocksUpdatedAt && (
        <div className="mt-3 text-xs opacity-50">
          Updated {new Date(stocksUpdatedAt).toLocaleTimeString()}
        </div>
      )}
    </Card>
  );
}
