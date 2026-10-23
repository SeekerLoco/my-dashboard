// tastytrade card: real balances from the latest Supabase snapshot, falling back to example placeholders.
'use client';

import Card from '@/components/Card';
import CardTitle from '@/components/CardTitle';
import StatusPill from '@/components/StatusPill';
import { AccountBadge, ExampleLabel } from '@/components/tastytrade/TT';
import { cardTiles } from '@/lib/tastytrade-placeholders';
import {
  useTastytrade,
  useBalanceHistory,
  dayPnl,
  money,
  asOfDenver,
  envLabel,
} from '@/lib/tastytrade';
import { greekTotals } from '@/lib/tastytrade-alerts';

const signed = (n: number, d: number) =>
  `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(d)}`;

export default function TastytradeCard() {
  const tt = useTastytrade();
  const live = tt.status === 'live' ? tt.accounts[0] : null;
  const history = useBalanceHistory(live ? [live.account.id] : []);
  const pnl =
    history.status === 'ready' && live
      ? dayPnl(history.byAccount[live.account.id] ?? [])
      : null;
  const g = live ? greekTotals(live.positions) : null;
  const hasGreeks = !!g && g.counted > 0;
  const noPositions = !!live && live.positions.length === 0;

  const tiles = live
    ? [
        { label: 'Net Liq', value: money(live.balance.net_liq) },
        {
          label: 'Option BP',
          value: money(live.balance.buying_power_derivative),
        },
        { label: 'Stock BP', value: money(live.balance.buying_power_equity) },
        {
          label: 'Day P&L',
          value:
            pnl === null
              ? '—'
              : `${pnl < 0 ? '−' : '+'}${money(Math.abs(pnl))}`,
        },
        {
          label: 'Portfolio Δ',
          value: hasGreeks
            ? signed(g.totals.delta, 1)
            : noPositions
              ? '0.0'
              : '—',
        },
        {
          label: 'Portfolio Θ',
          value: hasGreeks
            ? `${signed(g.totals.theta, 2)}/day`
            : noPositions
              ? '0.00'
              : '—',
        },
      ]
    : cardTiles;

  return (
    <Card accent="orange">
      <div className="flex items-center justify-between">
        <CardTitle icon="📈" accent="orange">
          <a href="/tastytrade" className="font-semibold hover:underline">
            tastytrade
          </a>
        </CardTitle>
        {live ? (
          <StatusPill label="Connected" accent="green" live />
        ) : (
          <StatusPill
            label={tt.status === 'loading' ? 'Loading…' : 'Not connected'}
            accent="orange"
          />
        )}
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-white/60">
        {live ? (
          <>
            <AccountBadge account={envLabel(live.account.environment)} />
            <span>
              …{live.account.account_last4} · as of{' '}
              {asOfDenver(live.balance.as_of)}
            </span>
          </>
        ) : tt.status === 'none' ? (
          <>
            <ExampleLabel />
            <span>No live data</span>
          </>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl bg-white/5 p-2">
            <p className="text-xs text-white/60">{t.label}</p>
            <p className="font-semibold">{t.value}</p>
          </div>
        ))}
      </div>
      <a
        href="/tastytrade"
        className="mt-3 inline-block text-sm text-orange-300 hover:underline"
      >
        Open tastytrade section →
      </a>
    </Card>
  );
}
