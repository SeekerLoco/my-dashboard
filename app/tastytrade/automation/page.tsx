// Step 5 Automation: not enabled; rules, disabled risk-limits form, disabled kill switch, and activity log.
import StepHeader from '@/components/tastytrade/StepHeader';
import { Section, Table, NotEnabled } from '@/components/tastytrade/TT';
import * as D from '@/lib/tastytrade-placeholders';

export default function AutomationPage() {
  return (
    <>
      <StepHeader slug="automation" />
      <NotEnabled what="Automation" />
      <button
        disabled
        className="w-full mb-4 py-6 rounded-2xl bg-red-600/40 border-2 border-red-400/50 text-2xl font-extrabold tracking-wide text-red-100 cursor-not-allowed"
      >
        🛑 KILL SWITCH (disabled)
      </button>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 opacity-60">
        <Section title="Rules" accent="pink">
          <ol className="space-y-1.5 text-sm list-decimal list-inside">
            {D.rules.map((r) => (
              <li key={r} className="rounded-xl bg-white/5 p-2">
                {r}
              </li>
            ))}
          </ol>
        </Section>
        <Section title="Risk limits" accent="orange">
          <form className="space-y-3 text-sm">
            {D.riskLimits.map((l) => (
              <label
                key={l.label}
                className="flex items-center justify-between gap-3"
              >
                <span>{l.label}</span>
                {l.type === 'checkbox' ? (
                  <input type="checkbox" disabled defaultChecked />
                ) : (
                  <input
                    type="number"
                    disabled
                    defaultValue={l.value}
                    className="w-24 rounded-lg bg-white/5 border border-white/10 px-2 py-1 disabled:opacity-60"
                  />
                )}
              </label>
            ))}
            <button
              type="button"
              disabled
              className="px-3 py-1.5 rounded-lg bg-white/10 opacity-60 cursor-not-allowed"
            >
              Save limits
            </button>
          </form>
        </Section>
        <Section title="Activity log" accent="blue" className="lg:col-span-2">
          <Table
            head={['Time', 'Event']}
            rows={D.activityLog.map((a) => [a.time, a.msg])}
          />
        </Section>
      </div>
    </>
  );
}
