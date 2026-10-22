// Step 2 Research: screener, option chain viewer, watchlists, and backtest placeholders.
import StepHeader from '@/components/tastytrade/StepHeader';
import { Section, Table, KV } from '@/components/tastytrade/TT';
import * as D from '@/lib/tastytrade-placeholders';

export default function ResearchPage() {
  return (
    <>
      <StepHeader slug="research" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger">
        <Section title="Screener" accent="teal">
          <Table
            head={['Symbol', 'IV Rank', 'Liquidity', 'Earnings']}
            rows={D.screener.map((s) => [
              s.symbol,
              s.ivRank,
              s.liquidity,
              s.earnings,
            ])}
          />
        </Section>
        <Section title="Option chain viewer (SPY, 2026-11-20)" accent="blue">
          <Table
            head={['Call bid', 'Call ask', 'Strike', 'Put bid', 'Put ask']}
            rows={D.optionChain.map((o) => [
              o.callBid,
              o.callAsk,
              o.strike,
              o.putBid,
              o.putAsk,
            ])}
          />
        </Section>
        <Section title="Watchlists" accent="violet">
          {D.watchlists.map((w) => (
            <div key={w.name} className="mb-2">
              <p className="text-sm font-medium">{w.name}</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {w.symbols.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded-full bg-white/10 text-xs"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </Section>
        <Section title="Backtest results" accent="orange">
          <KV items={D.backtest} />
        </Section>
      </div>
    </>
  );
}
