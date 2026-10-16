'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dates';

type Tx = {
  'Action Date': string;
  Action: string;
  Amount: number;
  Verified: string;
};

type Level = 'year' | 'month' | 'day';

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

  function groupData(
    action: string,
    level: Level,
    filter: string | null,
    splitVerified = false,
  ) {
    let filtered = transactions.filter((t) => t.Action === action);
    if (filter) {
      if (level === 'month')
        filtered = filtered.filter((t) => t['Action Date'].startsWith(filter));
      if (level === 'day')
        filtered = filtered.filter((t) => t['Action Date'].startsWith(filter));
    }

    const groups: Record<
      string,
      { total: number; expected: number; verified: number }
    > = {};

    filtered.forEach((t) => {
      const d = t['Action Date'];
      let key = d.slice(0, 4); // year
      if (level === 'month') key = d.slice(0, 7);
      if (level === 'day') key = d;

      if (!groups[key]) groups[key] = { total: 0, expected: 0, verified: 0 };
      groups[key].total += t.Amount || 0;
      if (t.Verified === 'Expected') groups[key].expected += t.Amount || 0;
      if (t.Verified === 'Verified') groups[key].verified += t.Amount || 0;
    });

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, vals]) => ({ key, ...vals }));
  }

  function BarChart({
    data,
    onBarClick,
    split = false,
  }: {
    data: { key: string; total: number; expected: number; verified: number }[];
    onBarClick: (key: string) => void;
    split?: boolean;
  }) {
    if (!data.length) return <div className="text-sm opacity-60">No data</div>;

    const max = Math.max(
      ...data.map((d) => (split ? Math.max(d.expected, d.verified) : d.total)),
      1,
    );
    const barWidth = Math.min(48, 560 / data.length);
    const chartWidth = data.length * (barWidth + 10) + 70;
    const chartHeight = 260;
    const paddingLeft = 55;
    const paddingBottom = 30;

    const toY = (val: number) =>
      chartHeight -
      paddingBottom -
      (val / max) * (chartHeight - paddingBottom - 20);

    // Simple y-axis ticks
    const ticks = [0, max / 2, max];

    return (
      <svg
        width="100%"
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      >
        {/* Y-axis line */}
        <line
          x1={paddingLeft}
          y1={20}
          x2={paddingLeft}
          y2={chartHeight - paddingBottom}
          stroke="currentColor"
          strokeWidth="0.75"
          opacity="0.4"
        />

        {/* Y-axis ticks and labels */}
        {ticks.map((tick, i) => (
          <g key={i}>
            <line
              x1={paddingLeft - 4}
              y1={toY(tick)}
              x2={paddingLeft}
              y2={toY(tick)}
              stroke="currentColor"
              strokeWidth="0.75"
              opacity="0.4"
            />
            <text
              x={paddingLeft - 8}
              y={toY(tick) + 3}
              textAnchor="end"
              fontSize="11"
              fill="currentColor"
              opacity="0.7"
            >
              ${Math.round(tick).toLocaleString()}
            </text>
          </g>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const x = paddingLeft + 10 + i * (barWidth + 10);

          if (split) {
            const expH = chartHeight - paddingBottom - toY(d.expected);
            const verH = chartHeight - paddingBottom - toY(d.verified);
            return (
              <g
                key={d.key}
                onClick={() => onBarClick(d.key)}
                className="cursor-pointer"
              >
                <rect
                  x={x}
                  y={toY(d.expected)}
                  width={barWidth / 2 - 1}
                  height={expH}
                  fill="#fbbf24"
                />
                <rect
                  x={x + barWidth / 2}
                  y={toY(d.verified)}
                  width={barWidth / 2 - 1}
                  height={verH}
                  fill="#34d399"
                />
                <text
                  x={x + barWidth / 4}
                  y={toY(d.expected) - 4}
                  textAnchor="middle"
                  fontSize="11"
                  fill="currentColor"
                >
                  {d.expected ? Math.round(d.expected).toLocaleString() : ''}
                </text>
                <text
                  x={x + (barWidth * 3) / 4}
                  y={toY(d.verified) - 4}
                  textAnchor="middle"
                  fontSize="11"
                  fill="currentColor"
                >
                  {d.verified ? Math.round(d.verified).toLocaleString() : ''}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  fontSize="11"
                  fill="currentColor"
                >
                  {d.key.length > 7 ? d.key.slice(5) : d.key}
                </text>
              </g>
            );
          }

          const h = chartHeight - paddingBottom - toY(d.total);
          return (
            <g
              key={d.key}
              onClick={() => onBarClick(d.key)}
              className="cursor-pointer"
            >
              <rect
                x={x}
                y={toY(d.total)}
                width={barWidth}
                height={h}
                fill="#60a5fa"
              />
              <text
                x={x + barWidth / 2}
                y={toY(d.total) - 4}
                textAnchor="middle"
                fontSize="11"
                fill="currentColor"
              >
                {Math.round(d.total).toLocaleString()}
              </text>
              <text
                x={x + barWidth / 2}
                y={chartHeight - 8}
                textAnchor="middle"
                fontSize="11"
                fill="currentColor"
              >
                {d.key.length > 7 ? d.key.slice(5) : d.key}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  const redemptionData = groupData(
    'Redemption',
    redemptionLevel,
    redemptionFilter,
  );
  const interestData = groupData(
    'Interest',
    interestLevel,
    interestFilter,
    true,
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">SDLT Charts</h1>
          <a href="/sdlt" className="text-blue-400 hover:underline">
            ← SDLT
          </a>
        </div>

        <div className="flex gap-3 mb-6 items-center text-sm">
          <label>
            Start
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="ml-2 bg-slate-800 border border-slate-700 rounded px-2 py-1"
            />
          </label>
          <label>
            End
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="ml-2 bg-slate-800 border border-slate-700 rounded px-2 py-1"
            />
          </label>
        </div>

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
            data={redemptionData}
            onBarClick={(key) => {
              if (redemptionLevel === 'year') {
                setRedemptionLevel('month');
                setRedemptionFilter(key);
              } else if (redemptionLevel === 'month') {
                setRedemptionLevel('day');
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
            data={interestData}
            split
            onBarClick={(key) => {
              if (interestLevel === 'year') {
                setInterestLevel('month');
                setInterestFilter(key);
              } else if (interestLevel === 'month') {
                setInterestLevel('day');
                setInterestFilter(key);
              }
            }}
          />
        </div>
      </div>
    </main>
  );
}
