// Research "Option chain viewer" card: pick a saved symbol and expiration; shows the chain TT bot saved (tt_chain_snapshots and tt_chain_rows).
'use client';

import { useMemo, useState } from 'react';
import { Section } from '@/components/tastytrade/TT';
import { asOfDenver, denverDay, useTastytrade } from '@/lib/tastytrade';
import {
  num,
  pivotChain,
  useChainRows,
  useChainSnapshots,
  useEarningsMap,
  useWatchlists,
  type ChainRow,
} from '@/lib/tastytrade-research';

const f = (v: number | string | null, d = 2) => {
  const n = num(v);
  return n === null ? '—' : n.toFixed(d);
};
const ivPct = (v: number | string | null) => {
  const n = num(v);
  return n === null ? '—' : `${(n * 100).toFixed(0)}%`;
};

function Side({ r, align }: { r?: ChainRow; align: 'left' | 'right' }) {
  const cls = align === 'left' ? 'text-right' : 'text-right';
  return (
    <>
      <td className={`py-1 px-1.5 ${cls}`}>{f(r?.bid ?? null)}</td>
      <td className={`py-1 px-1.5 ${cls}`}>{f(r?.ask ?? null)}</td>
      <td className={`py-1 px-1.5 ${cls}`}>{f(r?.delta ?? null)}</td>
      <td className={`py-1 px-1.5 ${cls}`}>{ivPct(r?.iv ?? null)}</td>
      <td className={`py-1 px-1.5 ${cls}`}>
        {r?.open_interest == null
          ? '—'
          : num(r.open_interest)?.toLocaleString('en-US')}
      </td>
    </>
  );
}

export default function ChainViewer() {
  const snaps = useChainSnapshots();
  const lists = useWatchlists();
  const earnings = useEarningsMap();
  const tt = useTastytrade();
  const [sym, setSym] = useState<string | null>(null);
  const [exp, setExp] = useState<string | null>(null);
  const [allStrikes, setAllStrikes] = useState(false);
  const WINDOW = 12; // strikes shown each side of the stock price

  const saved = useMemo(
    () => (snaps.status === 'ready' ? snaps.snaps : []),
    [snaps],
  );
  // Show symbols on a watchlist or underlying an open position; until both have loaded, show everything saved.
  const symbols = useMemo(() => {
    const saved_ = [...new Set(saved.map((s) => s.symbol))];
    if (lists.state.status !== 'ready' || tt.status === 'loading') {
      return { have: saved_, extra: [] as string[] };
    }
    const wanted = new Set<string>(
      lists.state.lists.flatMap((l) => l.items.map((i) => i.symbol)),
    );
    if (tt.status === 'live') {
      for (const a of tt.accounts)
        for (const p of a.positions) wanted.add(p.underlying ?? p.symbol);
    }
    const have = saved_.filter((x) => wanted.has(x));
    const extra = [...wanted].filter((w) => !saved_.includes(w)).sort();
    return { have, extra };
  }, [saved, lists.state, tt]);

  const symbol = sym ?? symbols.have[0] ?? null;
  const today = denverDay(new Date().toISOString());
  // Hide expirations that have already passed; saved chains for them are stale.
  const exps = saved
    .filter((s) => s.symbol === symbol && s.expiration >= today)
    .sort((a, b) => a.expiration.localeCompare(b.expiration));
  const snap = exps.find((s) => s.expiration === exp) ?? exps[0] ?? null;
  const rows = useChainRows(snap?.id ?? null);
  const dte = (e: string) =>
    Math.round((Date.parse(e) - Date.parse(today)) / 86_400_000);
  const earn = symbol ? earnings[symbol] : undefined;
  const hasEarnings = (e: string) =>
    earn !== undefined && earn >= today && earn <= e;
  const price = snap ? num(snap.underlying_price) : null;
  const strikes = useMemo(
    () => (rows.status === 'ready' ? pivotChain(rows.rows) : []),
    [rows],
  );
  const nearestIdx =
    price === null || strikes.length === 0
      ? Math.floor(strikes.length / 2)
      : strikes.reduce(
          (best, x, i) =>
            Math.abs(x.strike - price) < Math.abs(strikes[best].strike - price)
              ? i
              : best,
          0,
        );
  const nearest = strikes[nearestIdx];
  const shown = allStrikes
    ? strikes
    : strikes.slice(Math.max(0, nearestIdx - WINDOW), nearestIdx + WINDOW + 1);

  const selCls = 'rounded-lg bg-white/10 px-2 py-1 text-sm outline-none';
  return (
    <Section
      title={`Option chain viewer${snap ? ` (${snap.symbol}, ${snap.expiration})` : ''}`}
      accent="blue"
      example={false}
    >
      {snaps.status === 'loading' && (
        <p className="text-sm text-white/60">Loading…</p>
      )}
      {snaps.status === 'error' && (
        <p className="text-sm text-red-300">Could not load: {snaps.message}</p>
      )}
      {snaps.status === 'ready' && symbols.have.length === 0 && (
        <p className="text-sm text-white/60">
          No chains saved yet. Ask TT bot to save one.
        </p>
      )}
      {snaps.status === 'ready' && symbols.have.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <select
              className={selCls}
              value={symbol ?? ''}
              onChange={(e) => {
                setSym(e.target.value);
                setExp(null);
              }}
            >
              {symbols.have.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              {symbols.extra.map((s) => (
                <option key={s} value={`!${s}`}>
                  {s} (not yet saved)
                </option>
              ))}
            </select>
            <select
              className={selCls}
              value={snap?.expiration ?? ''}
              onChange={(e) => setExp(e.target.value)}
            >
              {exps.map((s) => (
                <option key={s.id} value={s.expiration}>
                  {s.expiration} ({dte(s.expiration)} DTE)
                  {hasEarnings(s.expiration) ? ' · includes earnings' : ''}
                </option>
              ))}
            </select>
          </div>
          {snap && !symbol?.startsWith('!') && (
            <p className="text-xs text-white/70">
              Chain saved {asOfDenver(snap.as_of)}
              {price !== null ? ` · ${snap.symbol} at ${f(price)} then` : ''}
            </p>
          )}
          {symbol?.startsWith('!') ? (
            <p className="text-sm text-white/60">
              {symbol.slice(1)} has no saved chain. Ask TT bot to save one.
            </p>
          ) : (
            <>
              {rows.status === 'loading' && (
                <p className="text-sm text-white/60">Loading chain…</p>
              )}
              {rows.status === 'error' && (
                <p className="text-sm text-red-300">
                  Could not load: {rows.message}
                </p>
              )}
              {rows.status === 'ready' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-white/60">
                      <tr>
                        <th colSpan={5} className="text-center font-medium">
                          Calls
                        </th>
                        <th />
                        <th colSpan={5} className="text-center font-medium">
                          Puts
                        </th>
                      </tr>
                      <tr>
                        {['Bid', 'Ask', 'Δ', 'IV', 'OI'].map((h) => (
                          <th
                            key={`c${h}`}
                            className="px-1.5 text-right font-medium"
                          >
                            {h}
                          </th>
                        ))}
                        <th className="px-2 font-semibold text-white">
                          Strike
                        </th>
                        {['Bid', 'Ask', 'Δ', 'IV', 'OI'].map((h) => (
                          <th
                            key={`p${h}`}
                            className="px-1.5 text-right font-medium"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((r) => {
                        const near = r === nearest;
                        return (
                          <tr
                            key={r.strike}
                            className={`border-t border-white/10 ${near ? 'bg-sky-500/15' : ''}`}
                          >
                            <Side r={r.call} align="left" />
                            <td className="px-2 text-center font-semibold">
                              {r.strike}
                            </td>
                            <Side r={r.put} align="right" />
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {strikes.length > shown.length || allStrikes ? (
                <button
                  type="button"
                  className="text-xs text-sky-300 hover:underline"
                  onClick={() => setAllStrikes((v) => !v)}
                >
                  {allStrikes
                    ? 'Show fewer strikes'
                    : `Show all ${strikes.length} strikes`}
                </button>
              ) : null}
              {snap && hasEarnings(snap.expiration) && (
                <p className="text-xs text-amber-300">
                  {snap.symbol} reports earnings on {earn}, before this
                  expiration.
                </p>
              )}
              {snap && (
                <p className="text-xs text-white/50">
                  {price !== null ? `${snap.symbol} at ${f(price)} · ` : ''}
                  saved {asOfDenver(snap.as_of)}. Saved data, not live quotes;
                  the highlighted strike is nearest the stock price.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </Section>
  );
}
