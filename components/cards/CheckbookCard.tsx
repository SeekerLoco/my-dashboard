// Checkbook card: today's verified balance (hideable) and a 90-day projected balance chart.
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dates';
import { useCountUp } from '@/lib/useCountUp';
import { fetchProjectedBalances } from '@/lib/checkbook-projection';
import Card from '@/components/Card';
import CardTitle from '@/components/CardTitle';
import StatusPill from '@/components/StatusPill';
import IconButton from '@/components/IconButton';
import ProjectionChart from '@/components/charts/ProjectionChart';
import type { ProjectionPoint } from '@/lib/types';

export default function CheckbookCard() {
  const [showBalance, setShowBalance] = useState(false);
  const [checkbookBalance, setCheckbookBalance] = useState<number | null>(null);
  // Count-up animation for the headline balance (only displayed when not masked)
  const animatedBalance = useCountUp(checkbookBalance);
  const [projection, setProjection] = useState<ProjectionPoint[]>([]);

  // Reads Supabase table daily_balances (verified_balance for today)
  async function fetchCheckbookBalance() {
    const today = getLocalDateString();
    const { data, error } = await supabase
      .from('daily_balances')
      .select('verified_balance')
      .eq('calendar_date', today)
      .single();

    if (!error && data) {
      setCheckbookBalance(data.verified_balance);
    }
  }

  useEffect(() => {
    fetchCheckbookBalance();
    // Default range (3M / 90 days) matches fetchProjectedBalances()'s default.
    fetchProjectedBalances().then(setProjection);
  }, []);

  return (
    <Card accent="teal">
      <div className="flex justify-between items-center mb-2">
        <CardTitle icon="💵" accent="teal">
          <a href="/transactions" className="font-semibold hover:underline">
            Checkbook
          </a>
        </CardTitle>
        <div className="flex items-center gap-2">
          <StatusPill label="Today" accent="teal" />
          <IconButton
            onClick={() => setShowBalance(!showBalance)}
            title={showBalance ? 'Hide balance' : 'Show balance'}
          >
            {showBalance ? '👁️' : '👁️‍🗨️'}
          </IconButton>
        </div>
      </div>

      <div className="text-4xl font-extrabold tracking-tight mt-1">
        {checkbookBalance === null
          ? '...'
          : showBalance
            ? `$${(animatedBalance ?? checkbookBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : '******'}
      </div>
      <div className="text-xs text-slate-400">verified balance</div>
      {/* Keeps text-3xl font-bold so the chart's SVG text and spacing render exactly as before */}
      <div className="text-3xl font-bold">
        {projection.length > 0 && <ProjectionChart data={projection} />}
      </div>
    </Card>
  );
}
