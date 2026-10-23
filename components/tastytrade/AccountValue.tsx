// Watch page "Account value" panel: live net liq chart and Day P&L per account from tt_balance_snapshots.
'use client';

import { Section, AccountBadge } from '@/components/tastytrade/TT';
import AccountValueChart from '@/components/charts/AccountValueChart';
import {
  useBalanceHistory,
  dayPnl,
  money,
  asOfDenver,
  envLabel,
  type TtAccountData,
  type TtState,
} from '@/lib/tastytrade';

function signedMoney(n: number): string {
  return `${n >= 0 ? '+' : '-'}${money(Math.abs(n))}`;
}

function Body({ accounts }: { accounts: TtAccountData[] }) {
  const hist = useBalanceHistory(accounts.map((a) => a.account.id));
  if (hist.status === 'loading')
    return <p className="text-sm text-white/60">Loading…</p>;
  if (hist.status === 'error')
    return (
      <p className="text-sm text-red-300">
        Couldn’t load account value: {hist.message}
      </p>
    );
  return (
    <div className="space-y-5">
      {accounts.map(({ account }) => {
        const points = hist.byAccount[account.id] ?? [];
        const last = points[points.length - 1];
        const pnl = dayPnl(points);
        return (
          <div key={account.id}>
            <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-white/60">
              <AccountBadge account={envLabel(account.environment)} />
              <span>…{account.account_last4}</span>
            </div>
            {!last ? (
              <p className="text-sm text-white/60">No snapshots yet</p>
            ) : (
              <>
                <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
                  <div>
                    <div className="text-xs text-white/60">
                      Net liq · as of {asOfDenver(last.as_of)}
                    </div>
                    <div className="text-2xl font-semibold">
                      {money(last.net_liq)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-white/60">Day P&amp;L</div>
                    <div
                      className={`text-2xl font-semibold ${pnl === null ? '' : pnl >= 0 ? 'text-emerald-300' : 'text-red-300'}`}
                    >
                      {pnl === null ? '—' : signedMoney(pnl)}
                    </div>
                  </div>
                </div>
                {points.length < 2 ? (
                  <p className="text-xs text-white/50 mt-2">
                    More snapshots will draw the line
                  </p>
                ) : (
                  <>
                    <AccountValueChart points={points} />
                    <p className="text-[11px] text-white/40">
                      Net liq change includes deposits and withdrawals.
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AccountValuePanel({ tt }: { tt: TtState }) {
  return (
    <Section
      title="Account value"
      accent="teal"
      className="lg:col-span-2"
      example={false}
    >
      {tt.status === 'loading' ? (
        <p className="text-sm text-white/60">Loading…</p>
      ) : tt.status === 'none' ? (
        <p className="text-sm text-white/60">No live data: {tt.reason}</p>
      ) : (
        <Body accounts={tt.accounts} />
      )}
    </Section>
  );
}
