// Step 1 Watch: read-only portfolio monitoring; balances, positions, account value and trade journal are live from Supabase; Greeks and alerts are placeholders.
'use client';

import StepHeader from '@/components/tastytrade/StepHeader';
import { Section, Table, KV, AccountBadge } from '@/components/tastytrade/TT';
import AccountValuePanel from '@/components/tastytrade/AccountValue';
import TradeJournal from '@/components/tastytrade/TradeJournal';
import * as D from '@/lib/tastytrade-placeholders';
import { useTastytrade, money, asOfDenver, envLabel } from '@/lib/tastytrade';

export default function WatchPage() {
  const tt = useTastytrade();
  const live = tt.status === 'live' ? tt.accounts : null;
  const fallbackNote =
    tt.status === 'none' ? (
      <p className="text-xs text-white/50 mt-2">No live data</p>
    ) : tt.status === 'loading' ? (
      <p className="text-xs text-white/50 mt-2">Loading…</p>
    ) : null;
  return (
    <>
      <StepHeader slug="watch" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger">
        <Section
          title="Positions"
          accent="blue"
          className="lg:col-span-2"
          example={!live}
        >
          {live ? (
            live.every((a) => a.positions.length === 0) ? (
              <p className="text-sm text-white/60">No positions</p>
            ) : (
              <Table
                head={[
                  'Account',
                  'Symbol',
                  'Type',
                  'Qty',
                  'Dir',
                  'Exp',
                  'Strike',
                  'Mark',
                ]}
                rows={live.flatMap((a) =>
                  a.positions.map((p) => [
                    `…${a.account.account_last4}`,
                    p.symbol,
                    [p.instrument_type, p.option_type]
                      .filter(Boolean)
                      .join(' ') || '—',
                    String(p.quantity ?? '—'),
                    p.direction ?? '—',
                    p.expiration ?? '—',
                    p.strike === null ? '—' : String(p.strike),
                    money(p.mark),
                  ]),
                )}
              />
            )
          ) : (
            <>
              <Table
                head={['Symbol', 'Strategy', 'Qty', 'DTE', 'P&L']}
                rows={D.positions.map((p) => [
                  p.symbol,
                  p.type,
                  p.qty,
                  p.dte,
                  p.pl,
                ])}
              />
              {fallbackNote}
            </>
          )}
        </Section>
        <Section title="Balances" accent="green" example={!live}>
          {live ? (
            <div className="space-y-3">
              {live.map((a) => (
                <div key={a.account.id}>
                  <div className="flex items-center gap-2 mb-2 text-xs text-white/60">
                    <AccountBadge account={envLabel(a.account.environment)} />
                    <span>
                      …{a.account.account_last4}
                      {a.account.account_type
                        ? ` · ${a.account.account_type}`
                        : ''}{' '}
                      · as of {asOfDenver(a.balance.as_of)}
                    </span>
                  </div>
                  <KV
                    items={[
                      {
                        label: 'Net Liquidating Value',
                        value: money(a.balance.net_liq),
                      },
                      { label: 'Cash Balance', value: money(a.balance.cash) },
                      {
                        label: 'Option Buying Power',
                        value: money(a.balance.buying_power_derivative),
                      },
                      {
                        label: 'Stock Buying Power',
                        value: money(a.balance.buying_power_equity),
                      },
                    ]}
                  />
                </div>
              ))}
            </div>
          ) : (
            <>
              <KV items={D.balances} />
              {fallbackNote}
            </>
          )}
        </Section>
        <Section title="Greeks summary" accent="violet">
          <KV items={D.greeks} />
        </Section>
        <AccountValuePanel tt={tt} />
        <TradeJournal tt={tt} />
        <Section title="Alerts" accent="pink">
          <ul className="space-y-1.5 text-sm">
            {D.alerts.map((a) => (
              <li key={a} className="rounded-xl bg-white/5 p-2">
                ⚠️ {a}
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </>
  );
}
