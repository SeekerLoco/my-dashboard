// Watch page "Alerts" panel: rule-based warnings computed in the browser from the newest snapshot on every page load.
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Section } from '@/components/tastytrade/TT';
import { asOfDenver, useTradeJournal, type TtState } from '@/lib/tastytrade';
import {
  RULE_LINES,
  evaluateAlerts,
  underlyingsNeedingPrice,
  type Alert,
  type AlertSeverity,
  type PriceMap,
} from '@/lib/tastytrade-alerts';

const SEVERITY_CLS: Record<AlertSeverity, string> = {
  critical: 'bg-red-500/15 border-red-400/40 text-red-200',
  warn: 'bg-amber-500/15 border-amber-400/40 text-amber-200',
  good: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200',
  info: 'bg-sky-500/15 border-sky-400/40 text-sky-200',
};

const SEVERITY_ICON: Record<AlertSeverity, string> = {
  critical: '🔴',
  warn: '🟠',
  good: '🟢',
  info: 'ℹ️',
};

type PriceState = { status: 'loading' } | { status: 'ready'; prices: PriceMap };

// Stock prices for the underlyings of short options, from our /api/stocks route (Yahoo Finance).
function useUnderlyingPrices(symbols: string[]): PriceState {
  const key = symbols.join(',');
  const [fetched, setFetched] = useState<{
    key: string;
    prices: PriceMap;
  } | null>(null);
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    fetch(`/api/stocks?symbols=${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .then((data: { quotes?: { symbol?: string; price?: number }[] }) => {
        const prices: PriceMap = {};
        for (const q of data.quotes ?? [])
          if (q.symbol && typeof q.price === 'number')
            prices[q.symbol] = q.price;
        if (!cancelled) setFetched({ key, prices });
      })
      .catch(() => {
        if (!cancelled) setFetched({ key, prices: {} });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);
  if (!key) return { status: 'ready', prices: {} };
  if (fetched?.key !== key) return { status: 'loading' };
  return { status: 'ready', prices: fetched.prices };
}

function AlertRow({ a }: { a: Alert }) {
  return (
    <li className={`rounded-xl border p-2.5 ${SEVERITY_CLS[a.severity]}`}>
      <div className="flex flex-wrap items-center gap-x-2 text-xs opacity-80">
        <span>{SEVERITY_ICON[a.severity]}</span>
        <span className="font-semibold">{a.symbol}</span>
        <span>…{a.account}</span>
      </div>
      <p className="text-sm mt-0.5">{a.message}</p>
    </li>
  );
}

function Body({ tt }: { tt: Extract<TtState, { status: 'live' }> }) {
  const journal = useTradeJournal();
  const inputs = useMemo(
    () =>
      tt.accounts.map((a) => ({
        account: a.account,
        balance: a.balance,
        positions: a.positions,
      })),
    [tt.accounts],
  );
  const prices = useUnderlyingPrices(
    useMemo(() => underlyingsNeedingPrice(inputs), [inputs]),
  );
  // Checked once per page load, so the clock is read when the data arrives.
  const [now] = useState(() => new Date());

  if (journal.state.status === 'loading' || prices.status === 'loading')
    return <p className="text-sm text-white/60">Checking…</p>;

  const { alerts, notes } = evaluateAlerts({
    accounts: inputs,
    trades: journal.state.status === 'ready' ? journal.state.trades : null,
    prices: prices.prices,
    now,
  });
  const newest = tt.accounts
    .map((a) => a.balance.as_of)
    .sort()
    .pop();
  const noPositions = tt.accounts.every((a) => a.positions.length === 0);

  return (
    <div className="space-y-2">
      {noPositions && (
        <p className="text-sm text-white/70">
          No open positions, so nothing to check
        </p>
      )}
      {alerts.length > 0 ? (
        <ul className="space-y-1.5">
          {alerts.map((a) => (
            <AlertRow key={a.id} a={a} />
          ))}
        </ul>
      ) : (
        !noPositions && (
          <p className="rounded-xl bg-emerald-500/10 border border-emerald-400/30 p-2.5 text-sm text-emerald-200">
            No alerts — all clear
          </p>
        )
      )}
      {noPositions && !alerts.some((a) => a.rule === 'bp') && (
        <p className="text-xs text-white/50">Buying power checked: fine</p>
      )}
      {newest && (
        <p className="text-xs text-white/50">
          Checked against the snapshot as of {asOfDenver(newest)}
        </p>
      )}
      {notes.map((n) => (
        <p key={n} className="text-xs text-white/40">
          {n}
        </p>
      ))}
      <details className="text-xs text-white/60">
        <summary className="cursor-pointer select-none">Rules</summary>
        <ul className="list-disc pl-5 mt-1 space-y-0.5">
          {RULE_LINES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

export default function AlertsPanel({ tt }: { tt: TtState }) {
  return (
    <Section title="Alerts" accent="pink" example={tt.status !== 'live'}>
      {tt.status === 'loading' && (
        <p className="text-sm text-white/60">Loading…</p>
      )}
      {tt.status === 'none' && (
        <p className="text-sm text-white/60">
          No live data, so alerts can’t be checked
        </p>
      )}
      {tt.status === 'live' && <Body tt={tt} />}
    </Section>
  );
}
