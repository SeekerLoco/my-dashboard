// Step 4 Order Staging: not enabled; greyed preview of proposed trades with dry-run impact and suggested exits.
import StepHeader from '@/components/tastytrade/StepHeader';
import { Section, NotEnabled } from '@/components/tastytrade/TT';
import * as D from '@/lib/tastytrade-placeholders';

export default function StagingPage() {
  return (
    <>
      <StepHeader slug="staging" />
      <NotEnabled what="Order staging" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 opacity-50 pointer-events-none select-none">
        <Section title="Proposed trade queue" accent="orange">
          <ul className="space-y-2 text-sm">
            {D.proposedTrades.map((t) => (
              <li key={t.desc} className="rounded-xl bg-white/5 p-3">
                <p className="font-medium">{t.desc}</p>
                <p className="text-white/60 text-xs mt-1">
                  Credit {t.credit} · Dry-run margin {t.margin} · BP impact{' '}
                  {t.bp}
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    disabled
                    className="px-3 py-1 rounded-lg bg-emerald-500/50 text-xs"
                  >
                    Approve
                  </button>
                  <button
                    disabled
                    className="px-3 py-1 rounded-lg bg-red-500/50 text-xs"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Suggested exits" accent="green">
          <ul className="space-y-1.5 text-sm">
            {D.suggestedExits.map((e) => (
              <li key={e} className="rounded-xl bg-white/5 p-2">
                ↪ {e}
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </>
  );
}
