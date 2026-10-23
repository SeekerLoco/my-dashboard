// Live Greeks summary: sums the Greeks TT bot saves on each position snapshot, scaled to quantity x 100 and negated for short.
'use client';

import { Section, KV } from '@/components/tastytrade/TT';
import { greekTotals } from '@/lib/tastytrade-alerts';
import { asOfDenver, type TtState } from '@/lib/tastytrade';

const sgn = (n: number, d: number) =>
  `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(d)}`;

export default function GreeksSummary({ tt }: { tt: TtState }) {
  if (tt.status !== 'live')
    return (
      <Section title="Greeks summary" accent="violet" example={false}>
        <p className="text-sm text-white/60">
          {tt.status === 'loading' ? 'Loading…' : 'No live data'}
        </p>
      </Section>
    );
  const positions = tt.accounts.flatMap((a) => a.positions);
  if (positions.length === 0)
    return (
      <Section title="Greeks summary" accent="violet" example={false}>
        <p className="text-sm text-white/60">No positions</p>
      </Section>
    );
  const { totals, counted, skipped } = greekTotals(positions);
  if (counted === 0)
    return (
      <Section title="Greeks summary" accent="violet" example={false}>
        <p className="text-sm text-white/60">
          No Greeks saved yet. They fill in on the next snapshot.
        </p>
      </Section>
    );
  const asOf = tt.accounts
    .map((a) => a.balance.as_of)
    .filter(Boolean)
    .sort()
    .pop();
  return (
    <Section title="Greeks summary" accent="violet" example={false}>
      <KV
        items={[
          { label: 'Delta (shares)', value: sgn(totals.delta, 1) },
          { label: 'Theta ($ per day)', value: sgn(totals.theta, 2) },
          { label: 'Vega ($ per 1 IV pt)', value: sgn(totals.vega, 2) },
          { label: 'Gamma (shares per $1)', value: sgn(totals.gamma, 2) },
        ]}
      />
      <p className="text-xs text-white/50 mt-2">
        {counted} position{counted === 1 ? '' : 's'} counted
        {skipped > 0 ? `, ${skipped} without Greeks skipped (stock)` : ''}
        {asOf ? ` · as of ${asOfDenver(asOf)}` : ''}
      </p>
    </Section>
  );
}
