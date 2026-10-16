// Moon Shots: SDLT single-stock holdings (Trust + IRA combined) vs cost basis, and the interest limit.
// Rule: total cost basis must never exceed lifetime verified SDLT interest; market value doesn't count.
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LOTS, getPositions, lotCost } from '@/lib/holdings';
import { formatUSD } from '@/lib/format';
import { getLocalDateString, parseLocalDate } from '@/lib/dates';
import Card from '@/components/Card';
import CardTitle from '@/components/CardTitle';
import CardFooter from '@/components/CardFooter';
import StatusPill from '@/components/StatusPill';

type InterestRow = { date: string; amount: number };

const positions = getPositions();

function pct(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

function signedUSD(n: number) {
  return `${n >= 0 ? '+' : '-'}${formatUSD(Math.abs(n))}`;
}

export default function HoldingsChart() {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [interest, setInterest] = useState<InterestRow[] | null>(null);

  useEffect(() => {
    // Reads our API route /api/stocks?symbols=… for current prices of the held tickers
    async function loadPrices() {
      try {
        const symbols = positions.map((p) => p.ticker).join(',');
        const res = await fetch(
          `/api/stocks?symbols=${encodeURIComponent(symbols)}`,
        );
        const data = await res.json();
        const map: Record<string, number> = {};
        for (const q of data.quotes as { symbol: string; price: number }[]) {
          map[q.symbol] = q.price;
        }
        setPrices(map);
        setUpdatedAt(data.updatedAt);
      } catch (err) {
        console.error('Failed to load holding prices', err);
      }
    }
    // Reads Supabase table SDLT_Transactions (Action = Interest, Verified = Verified) for the limit
    async function loadInterest() {
      const { data, error } = await supabase
        .from('SDLT_Transactions')
        .select('"Action Date", Amount')
        .eq('Action', 'Interest')
        .eq('Verified', 'Verified')
        .order('Action Date');
      if (error) console.error('Interest load error:', error.message);
      setInterest(
        (data || []).map((r) => ({
          date: r['Action Date'],
          amount: r.Amount || 0,
        })),
      );
    }
    loadPrices();
    loadInterest();
  }, []);

  const rows = positions.map((p) => {
    const price = prices[p.ticker];
    const value = price != null ? price * p.shares : null;
    const gain = value != null ? value - p.cost : null;
    return {
      ...p,
      price,
      value,
      gain,
      gainPct: gain != null ? (gain / p.cost) * 100 : null,
    };
  });
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const havePrices = rows.every((r) => r.value != null);
  const totalValue = havePrices
    ? rows.reduce((s, r) => s + (r.value ?? 0), 0)
    : null;
  const totalGain = totalValue != null ? totalValue - totalCost : null;
  const scale = Math.max(...rows.map((r) => Math.max(r.cost, r.value ?? 0)), 1);

  const limit = interest
    ? Math.round(interest.reduce((s, r) => s + r.amount, 0) * 100) / 100
    : null;
  const headroom = limit != null ? limit - totalCost : null;
  const over = headroom != null && headroom < 0;

  return (
    <Card accent="violet" className="mb-10">
      <div className="mb-4 flex justify-between items-center gap-2">
        <CardTitle icon="🚀" accent="violet">
          <h2 className="font-semibold">Moon Shots</h2>
        </CardTitle>
        <StatusPill
          label={over ? 'Over limit' : 'Within limit'}
          accent={over ? 'pink' : 'violet'}
          live={havePrices}
        />
      </div>

      {/* Per-ticker bars: cost basis vs market value */}
      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.ticker}>
            <div className="flex flex-wrap justify-between items-baseline gap-x-3 text-sm">
              <span className="font-semibold">
                {r.ticker}{' '}
                <span className="text-xs font-normal text-slate-400">
                  {r.shares} sh
                </span>
              </span>
              <span className="text-right">
                {r.value != null ? formatUSD(r.value) : '…'}{' '}
                {r.gain != null && (
                  <span
                    className={r.gain >= 0 ? 'text-green-400' : 'text-red-400'}
                  >
                    {signedUSD(r.gain)} ({pct(r.gainPct!)})
                  </span>
                )}
              </span>
            </div>
            <div className="mt-1 space-y-1">
              <div className="h-2 rounded-full bg-white/5">
                <div
                  className="h-2 rounded-full bg-violet-400/60"
                  style={{ width: `${(r.cost / scale) * 100}%` }}
                />
              </div>
              <div className="h-2 rounded-full bg-white/5">
                {r.value != null && (
                  <div
                    className={`h-2 rounded-full ${r.value >= r.cost ? 'bg-green-400' : 'bg-red-400'}`}
                    style={{ width: `${(r.value / scale) * 100}%` }}
                  />
                )}
              </div>
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Cost basis {formatUSD(r.cost)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-full bg-violet-400/60 inline-block" />{' '}
          Cost basis
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-full bg-green-400 inline-block" />{' '}
          Market value
        </span>
      </div>

      {/* Totals */}
      <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
        <span className="font-semibold">Total</span>
        <span>Cost {formatUSD(totalCost)}</span>
        <span>Value {totalValue != null ? formatUSD(totalValue) : '…'}</span>
        {totalGain != null && (
          <span className={totalGain >= 0 ? 'text-green-400' : 'text-red-400'}>
            {signedUSD(totalGain)} ({pct((totalGain / totalCost) * 100)})
          </span>
        )}
      </div>

      {/* Limit gauge: total cost basis vs lifetime verified interest */}
      <div className="mt-5">
        <div className="flex flex-wrap justify-between gap-x-3 text-sm mb-1">
          <span className="font-semibold">Interest limit</span>
          <span className="text-slate-300">
            {formatUSD(totalCost)} of {limit != null ? formatUSD(limit) : '…'}
          </span>
        </div>
        {limit != null && limit > 0 && (
          <>
            <div className="relative h-3 rounded-full bg-white/5 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-violet-400"
                style={{
                  width: `${(Math.min(totalCost, limit) / Math.max(totalCost, limit)) * 100}%`,
                }}
              />
              {over && (
                <div
                  className="absolute inset-y-0 right-0 bg-red-500"
                  style={{
                    width: `${((totalCost - limit) / totalCost) * 100}%`,
                  }}
                />
              )}
            </div>
            <div
              className={`mt-1 text-sm font-semibold ${over ? 'text-red-400' : 'text-green-400'}`}
            >
              {over
                ? `${formatUSD(-headroom!)} over the limit`
                : `${formatUSD(headroom!)} headroom`}
            </div>
          </>
        )}
        {interest && interest.length === 0 && (
          <div className="text-xs text-slate-400">
            No verified interest found.
          </div>
        )}
      </div>

      {interest && interest.length > 0 && (
        <CumulativeChart interest={interest} />
      )}

      {updatedAt && (
        <CardFooter>
          Prices updated {new Date(updatedAt).toLocaleTimeString()} · Limit =
          lifetime verified SDLT interest
        </CardFooter>
      )}
    </Card>
  );
}

// Small step chart: cumulative cost basis (all lots) vs cumulative verified interest over time.
function CumulativeChart({ interest }: { interest: InterestRow[] }) {
  const width = 600;
  const height = 140;
  const padL = 44;
  const padR = 8;
  const padT = 10;
  const padB = 20;

  const lots = [...LOTS].sort((a, b) => a.date.localeCompare(b.date));
  const start = parseLocalDate(
    lots[0].date < interest[0].date ? lots[0].date : interest[0].date,
  ).getTime();
  const end = parseLocalDate(getLocalDateString()).getTime();
  const span = Math.max(end - start, 1);

  function steps(events: { date: string; amount: number }[]) {
    let total = 0;
    const pts: [number, number][] = [[start, 0]];
    for (const e of events) {
      const t = parseLocalDate(e.date).getTime();
      pts.push([t, total]);
      total += e.amount;
      pts.push([t, total]);
    }
    pts.push([end, total]);
    return pts;
  }
  const costPts = steps(
    lots.map((l) => ({ date: l.date, amount: l.shares >= 0 ? lotCost(l) : 0 })),
  );
  const intPts = steps(interest);
  const max = Math.max(
    ...costPts.map((p) => p[1]),
    ...intPts.map((p) => p[1]),
    1,
  );

  const toX = (t: number) =>
    padL + ((t - start) / span) * (width - padL - padR);
  const toY = (v: number) => padT + (1 - v / max) * (height - padT - padB);
  const line = (pts: [number, number][]) =>
    pts.map(([t, v]) => `${toX(t)},${toY(v)}`).join(' ');

  return (
    <div className="mt-5">
      <div className="flex items-center gap-4 text-xs text-slate-400 mb-1">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-violet-400 inline-block" /> Cumulative
          cost
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-emerald-400 inline-block" /> Cumulative
          interest
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
        {[0, max / 2, max].map((tick, i) => (
          <text
            key={i}
            x={padL - 6}
            y={toY(tick) + 3}
            textAnchor="end"
            fontSize="10"
            fill="currentColor"
            opacity="0.6"
          >
            ${Math.round(tick).toLocaleString()}
          </text>
        ))}
        <line
          x1={padL}
          y1={toY(0)}
          x2={width - padR}
          y2={toY(0)}
          stroke="currentColor"
          strokeWidth="0.75"
          opacity="0.3"
        />
        <polyline
          fill="none"
          stroke="#34d399"
          strokeWidth="1.5"
          points={line(intPts)}
        />
        <polyline
          fill="none"
          stroke="#a78bfa"
          strokeWidth="1.5"
          points={line(costPts)}
        />
        <text
          x={padL}
          y={height - 4}
          fontSize="10"
          fill="currentColor"
          opacity="0.6"
        >
          {getLocalDateString(new Date(start)).slice(0, 7)}
        </text>
        <text
          x={width - padR}
          y={height - 4}
          textAnchor="end"
          fontSize="10"
          fill="currentColor"
          opacity="0.6"
        >
          Today
        </text>
      </svg>
    </div>
  );
}
