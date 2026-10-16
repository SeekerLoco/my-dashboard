'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dates';
import { groupByPeriod, nextLevel, type Level } from '@/lib/drilldown';
import BarChart from '@/components/charts/BarChart';
import DateRangeFilter from '@/components/DateRangeFilter';

type Tx = {
  'Action Date': string;
  Action: string;
  Amount: number;
  Verified: string;
};

export default function ChartsPage() {
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [redemptionLevel, setRedemptionLevel] = useState<Level>('year');
  const [redemptionFilter, setRedemptionFilter] = useState<string | null>(null);
  const [interestLevel, setInterestLevel] = useState<Level>('year');
  const [interestFilter, setInterestFilter] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    const start = new Date(today);
    start.setMonth(today.getMonth() - 36);
    const end = new Date(today);
    end.setMonth(today.getMonth() + 36);

    setStartDate(getLocalDateString(start));
    setEndDate(getLocalDateString(end));
  }, []);

  useEffect(() => {
    if (!startDate || !endDate) return;
    async function load() {
      const { data } = await supabase
        .from('SDLT_Transactions')
        .select('"Action Date", Action, Amount, Verified')
        .gte('Action Date', startDate)
        .lte('Action Date', endDate);
      if (data) setTransactions(data);
    }
    load();
  }, [startDate, endDate]);

  // Totals one Action per year/month/day, plus Expected and Verified subtotals
  function groupData(action: string, level: Level, filter: string | null) {
    return groupByPeriod(
      transactions.filter((t) => t.Action === action),
      (t) => t['Action Date'],
      level,
      filter,
    ).map(({ key, items }) => {
      const vals = { total: 0, expected: 0, verified: 0 };
      items.forEach((t) => {
        vals.total += t.Amount || 0;
        if (t.Verified === 'Expected') vals.expected += t.Amount || 0;
        if (t.Verified === 'Verified') vals.verified += t.Amount || 0;
      });
      return { key, ...vals };
    });
  }

  const redemptionData = groupData(
    'Redemption',
    redemptionLevel,
    redemptionFilter,
  );
  const interestData = groupData('Interest', interestLevel, interestFilter);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">SDLT Charts</h1>
          <a href="/sdlt" className="text-blue-400 hover:underline">
            ← SDLT
          </a>
        </div>

        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
        />

        {/* Redemptions */}
        <div className="mb-10 p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold">Redemptions</h2>
            {redemptionLevel !== 'year' && (
              <button
                onClick={() => {
                  setRedemptionLevel('year');
                  setRedemptionFilter(null);
                }}
                className="text-xs text-blue-400 hover:underline"
              >
                ← Back to years
              </button>
            )}
          </div>
          <BarChart
            variant="large"
            data={redemptionData}
            onBarClick={(key) => {
              const next = nextLevel(redemptionLevel);
              if (next) {
                setRedemptionLevel(next);
                setRedemptionFilter(key);
              }
            }}
          />
        </div>

        {/* Interest */}
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold">Interest</h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-yellow-400 inline-block" /> Expected
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-400 inline-block" /> Verified
              </span>
              {interestLevel !== 'year' && (
                <button
                  onClick={() => {
                    setInterestLevel('year');
                    setInterestFilter(null);
                  }}
                  className="text-blue-400 hover:underline"
                >
                  ← Back to years
                </button>
              )}
            </div>
          </div>
          <BarChart
            variant="large"
            data={interestData}
            split
            onBarClick={(key) => {
              const next = nextLevel(interestLevel);
              if (next) {
                setInterestLevel(next);
                setInterestFilter(key);
              }
            }}
          />
        </div>
      </div>
    </main>
  );
}
