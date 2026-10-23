// Research "Screener" card: the latest scan TT bot saved (tt_screener_scans and tt_screener_rows), best IV rank first.
'use client';

import { useState } from 'react';
import { Section, Table } from '@/components/tastytrade/TT';
import { asOfDenver, denverDay } from '@/lib/tastytrade';
import { num, useScan, useScanList } from '@/lib/tastytrade-research';

const fmt = (v: number | null, d = 2) => (v === null ? '—' : v.toFixed(d));
// "2026-10-26 (3d)" using Denver calendar days; just the date if it can't be parsed.
const earnLabel = (e: string | null) => {
  if (!e) return '—';
  const days = Math.round(
    (Date.parse(e.slice(0, 10)) -
      Date.parse(denverDay(new Date().toISOString()))) /
      86_400_000,
  );
  if (days < 0) return '—'; // already reported
  return Number.isNaN(days) ? e : `${e.slice(0, 10)} (${days}d)`;
};

export default function Screener() {
  const list = useScanList();
  const [pick, setPick] = useState<string | null>(null);
  const info =
    list.status === 'ready'
      ? (list.scans.find((x) => x.id === pick) ?? list.scans[0])
      : null;
  const scanState = useScan(info);
  const s =
    list.status === 'ready'
      ? scanState
      : list.status === 'none'
        ? ({ status: 'none' } as const)
        : list;
  const [all, setAll] = useState(false);
  const TOP = 25;
  return (
    <Section title="Screener" accent="teal" example={false}>
      {list.status === 'ready' && list.scans.length > 1 && (
        <select
          className="mb-2 w-full rounded-lg bg-white/10 px-2 py-1 text-sm outline-none"
          value={info?.id ?? ''}
          onChange={(e) => {
            setPick(e.target.value);
            setAll(false);
          }}
        >
          {list.scans.map((x, i) => (
            <option key={x.id} value={x.id}>
              {i === 0 ? 'Latest · ' : ''}
              {x.source ?? 'Scan'} · {asOfDenver(x.as_of)}
            </option>
          ))}
        </select>
      )}
      {s.status === 'loading' && (
        <p className="text-sm text-white/60">Loading…</p>
      )}
      {s.status === 'error' && (
        <p className="text-sm text-red-300">Could not load: {s.message}</p>
      )}
      {s.status === 'none' && (
        <p className="text-sm text-white/60">
          No scan saved yet. Ask TT bot to run one.
        </p>
      )}
      {s.status === 'ready' &&
        (() => {
          const sorted = [...s.scan.rows].sort(
            (a, b) => (num(b.iv_rank) ?? -1) - (num(a.iv_rank) ?? -1),
          );
          const shown = all ? sorted : sorted.slice(0, TOP);
          const hasVol = sorted.some((r) => num(r.option_volume) !== null);
          return (
            <>
              <Table
                head={[
                  'Symbol',
                  'Price',
                  'IV',
                  'IV Rank',
                  'Liquidity',
                  'Earnings',
                  ...(hasVol ? ['Opt vol'] : []),
                ]}
                rows={shown.map((r) => {
                  const iv = num(r.iv);
                  const vol = num(r.option_volume);
                  return [
                    r.symbol,
                    fmt(num(r.price)),
                    iv === null ? '—' : `${(iv * 100).toFixed(1)}%`,
                    fmt(num(r.iv_rank), 0),
                    fmt(num(r.liquidity_rating), 0),
                    earnLabel(r.next_earnings),
                    ...(hasVol
                      ? [vol === null ? '—' : vol.toLocaleString('en-US')]
                      : []),
                  ];
                })}
              />
              {sorted.length > TOP && (
                <button
                  type="button"
                  className="mt-2 text-xs text-teal-300 hover:underline"
                  onClick={() => setAll((v) => !v)}
                >
                  {all
                    ? `Show top ${TOP} only`
                    : `Show all ${sorted.length} symbols`}
                </button>
              )}
              <p className="text-xs text-white/50 mt-2">
                {s.scan.source ? `${s.scan.source} · ` : ''}saved{' '}
                {asOfDenver(s.scan.as_of)}
                {s.scan.note ? ` · ${s.scan.note}` : ''}. Highest IV rank first.
                Saved data, not live quotes.
              </p>
            </>
          );
        })()}
    </Section>
  );
}
