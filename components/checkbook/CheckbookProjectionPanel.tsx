// Transactions-page panel: interactive projected-balance chart with timeframe
// selector (default matches the Checkbook card's 90-day / 3M window) and an
// eye toggle that masks balances and amounts.
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Card from '@/components/Card';
import CardTitle from '@/components/CardTitle';
import IconButton from '@/components/IconButton';
import StatusPill from '@/components/StatusPill';
import InteractiveProjectionChart, {
  type DayTransaction,
} from '@/components/charts/InteractiveProjectionChart';
import {
  DEFAULT_PROJECTION_RANGE,
  PROJECTION_RANGE_KEYS,
  fetchProjectedBalances,
  type ProjectionRangeKey,
} from '@/lib/checkbook-projection';
import type { ProjectionPoint } from '@/lib/types';

export default function CheckbookProjectionPanel() {
  const [range, setRange] = useState<ProjectionRangeKey>(
    DEFAULT_PROJECTION_RANGE,
  );
  const [showBalance, setShowBalance] = useState(false);
  const [projection, setProjection] = useState<ProjectionPoint[]>([]);
  const [transactions, setTransactions] = useState<DayTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const points = await fetchProjectedBalances(range);
      if (cancelled) return;
      setProjection(points);

      if (points.length === 0) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      const start = points[0].date;
      const end = points[points.length - 1].date;
      const { data } = await supabase
        .from('Checkbook_Transactions')
        .select('id, Transaction_Date, Category, Type, Amount, Status')
        .gte('Transaction_Date', start)
        .lte('Transaction_Date', end)
        .order('Transaction_Date', { ascending: true });

      if (cancelled) return;
      setTransactions((data as DayTransaction[]) ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [range]);

  return (
    <Card accent="teal" className="mb-8">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
        <CardTitle icon="📈" accent="teal">
          Projected balance
        </CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-0.5"
            role="group"
            aria-label="Projection timeframe"
          >
            {PROJECTION_RANGE_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setRange(key)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition ${
                  range === key
                    ? 'bg-teal-500/25 text-teal-200 border border-teal-400/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
          <StatusPill
            label={range === DEFAULT_PROJECTION_RANGE ? 'Default' : range}
            accent="teal"
          />
          <IconButton
            onClick={() => setShowBalance(!showBalance)}
            title={showBalance ? 'Hide balance' : 'Show balance'}
          >
            {showBalance ? '👁️' : '👁️‍🗨️'}
          </IconButton>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-2">
        Forward projected balance from today
        {range === DEFAULT_PROJECTION_RANGE
          ? ' (same 90-day window as the Checkbook card)'
          : ''}
        .
      </p>

      {loading ? (
        <div className="text-sm text-slate-400 py-10 text-center">
          Loading projection…
        </div>
      ) : (
        <InteractiveProjectionChart
          data={projection}
          transactions={transactions}
          showBalance={showBalance}
        />
      )}
    </Card>
  );
}
