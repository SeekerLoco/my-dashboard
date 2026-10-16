// Checkbook card: today's verified balance (hideable) and a 90-day projected balance chart.
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dates';
import Card from '@/components/Card';
import CardTitle from '@/components/CardTitle';
import StatusPill from '@/components/StatusPill';
import IconButton from '@/components/IconButton';
import ProjectionChart from '@/components/charts/ProjectionChart';
import type { ProjectionPoint } from '@/lib/types';

export default function CheckbookCard() {
  const [showBalance, setShowBalance] = useState(true);
  const [checkbookBalance, setCheckbookBalance] = useState<number | null>(null);
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

  // Reads Supabase table daily_balances (projected_balance for the next 90 days)
  async function fetchProjection() {
    const today = getLocalDateString();
    const end = new Date();
    end.setDate(end.getDate() + 90);
    const endStr = getLocalDateString(end);

    const { data } = await supabase
      .from('daily_balances')
      .select('calendar_date, projected_balance')
      .gte('calendar_date', today)
      .lte('calendar_date', endStr)
      .order('calendar_date');

    if (data) {
      setProjection(
        data.map((row) => ({
          date: row.calendar_date,
          balance: row.projected_balance,
        })),
      );
    }
  }

  useEffect(() => {
    fetchCheckbookBalance();
    fetchProjection();
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
            ? `$${checkbookBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
