// Step 3 Sandbox: practice-account banner, disabled multi-leg order ticket, and practice orders list.
import StepHeader from '@/components/tastytrade/StepHeader';
import { Section, Table } from '@/components/tastytrade/TT';
import * as D from '@/lib/tastytrade-placeholders';

const input =
  'w-full rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-sm disabled:opacity-60';

export default function SandboxPage() {
  return (
    <>
      <StepHeader slug="sandbox" />
      <div className="panel mb-4 p-4 border-2 border-amber-400/40 bg-amber-500/10 text-center font-semibold text-amber-200">
        🧪 Practice account — fake money, resets daily
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger">
        <Section title="Multi-leg order ticket" accent="violet">
          <div className="grid grid-cols-5 gap-2 text-xs text-white/60 mb-1">
            <span>Action</span>
            <span>Qty</span>
            <span>Type</span>
            <span>Strike</span>
            <span>Exp</span>
          </div>
          {D.ticketLegs.map((l, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 mb-2">
              <input disabled className={input} defaultValue={l.action} />
              <input disabled className={input} defaultValue={l.qty} />
              <input disabled className={input} defaultValue={l.type} />
              <input disabled className={input} defaultValue={l.strike} />
              <input disabled className={input} defaultValue={l.exp} />
            </div>
          ))}
          <div className="flex gap-2 mt-3">
            <button
              disabled
              className="px-3 py-1.5 rounded-lg bg-white/10 text-sm opacity-60 cursor-not-allowed"
            >
              + Add leg
            </button>
            <button
              disabled
              className="px-3 py-1.5 rounded-lg bg-violet-500/60 text-sm opacity-60 cursor-not-allowed ml-auto"
            >
              Send practice order
            </button>
          </div>
        </Section>
        <Section title="Practice orders & fills" accent="teal">
          <Table
            head={['Time', 'Order', 'Status']}
            rows={D.practiceOrders.map((o) => [o.time, o.desc, o.status])}
          />
        </Section>
      </div>
    </>
  );
}
