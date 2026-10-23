// Step 2 Research: watchlists, screener and option chains are live from Supabase (saved by TT bot); backtest results are still example data.
'use client';

import StepHeader from '@/components/tastytrade/StepHeader';
import { Section, KV } from '@/components/tastytrade/TT';
import Screener from '@/components/tastytrade/Screener';
import ChainViewer from '@/components/tastytrade/ChainViewer';
import Watchlists from '@/components/tastytrade/Watchlists';
import * as D from '@/lib/tastytrade-placeholders';

export default function ResearchPage() {
  return (
    <>
      <StepHeader slug="research" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger">
        <Screener />
        <ChainViewer />
        <Watchlists />
        <Section title="Backtest results" accent="orange">
          <KV items={D.backtest} />
        </Section>
      </div>
    </>
  );
}
