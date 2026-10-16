'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type ChartRow = {
  'End of Month': string;
  running_actual: number;
};

type ProgressRow = {
  id: string;
  'End of Month': string;
  'Actual Contribution': number | null;
  'Actual Interest': number | null;
  'Actual Value IRA': number | null;
  'Actual Value Trust': number | null;
};

export default function ProgressPage() {
  const [chartRows, setChartRows] = useState<ChartRow[]>([]);
  const [progressRows, setProgressRows] = useState<ProgressRow[]>([]);
  const [editing, setEditing] = useState<{ id: string; field: string } | null>(null);

  async function loadChart() {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('sdlt_progress_summary')
      .select('"End of Month", running_actual')
      .lte('End of Month', today)
      .order('End of Month');
    if (data) setChartRows(data);
  }

  async function loadProgress() {
    const { data } = await supabase
      .from('SDLT_Progress')
      .select('id, "End of Month", "Actual Contribution", "Actual Interest", "Actual Value IRA", "Actual Value Trust"')
      .order('End of Month');
    if (data) setProgressRows(data);
  }

  useEffect(() => {
    loadChart();
    loadProgress();
  }, []);

  async function updateProgress(id: string, field: string, value: string) {
    const num = value === '' ? null : parseFloat(value);
    await supabase.from('SDLT_Progress').update({ [field]: num }).eq('id', id);
    loadProgress();
    loadChart();
  }

  function ProgressChart({ data }: { data: ChartRow[] }) {
    if (data.length < 2) return <div className="text-sm opacity-60">Not enough data</div>;

    const width = 700;
    const height = 320;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;

    const goal = 100000;
    const yMax = 110000;
    const yMin = 0;

    const firstDate = new Date(data[0]['End of Month']);
    const endDate = new Date('2040-12-01');
    const totalMonths =
      (endDate.getFullYear() - firstDate.getFullYear()) * 12 +
      (endDate.getMonth() - firstDate.getMonth());

    const toX = (monthIndex: number) =>
      paddingLeft + (monthIndex / totalMonths) * (width - paddingLeft - paddingRight);
    const toY = (val: number) =>
      paddingTop + (1 - (val - yMin) / (yMax - yMin)) * (height - paddingTop - paddingBottom);

    const points = data
      .map((d) => {
        const dDate = new Date(d['End of Month']);
        const monthIndex =
          (dDate.getFullYear() - firstDate.getFullYear()) * 12 +
          (dDate.getMonth() - firstDate.getMonth());
        return `${toX(monthIndex)},${toY(d.running_actual)}`;
      })
      .join(' ');

    const n = data.length;
    const sumX = data.reduce((s, _, i) => s + i, 0);
    const sumY = data.reduce((s, d) => s + d.running_actual, 0);
    const sumXY = data.reduce((s, d, i) => s + i * d.running_actual, 0);
    const sumXX = data.reduce((s, _, i) => s + i * i, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const trendEndVal = intercept + slope * totalMonths;

    const ticks = [0, 25000, 50000, 75000, 100000];

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={height - paddingBottom} stroke="currentColor" strokeWidth="0.75" opacity="0.4" />
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={paddingLeft - 4} y1={toY(tick)} x2={paddingLeft} y2={toY(tick)} stroke="currentColor" strokeWidth="0.75" opacity="0.4" />
            <text x={paddingLeft - 8} y={toY(tick) + 3} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.7">
              ${(tick / 1000).toFixed(0)}k
            </text>
          </g>
        ))}
        <line x1={paddingLeft} y1={toY(goal)} x2={width - paddingRight} y2={toY(goal)} stroke="#f87171" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x={width - paddingRight - 4} y={toY(goal) - 6} textAnchor="end" fontSize="10" fill="#f87171">$100k goal</text>
        <line x1={toX(0)} y1={toY(intercept)} x2={toX(totalMonths)} y2={toY(trendEndVal)} stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="3 2" />
        <polyline fill="none" stroke="#60a5fa" strokeWidth="2" points={points} />
        <text x={toX(0)} y={height - 10} fontSize="10" fill="currentColor" opacity="0.7">{data[0]['End of Month'].slice(0, 4)}</text>
        <text x={toX(totalMonths)} y={height - 10} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.7">2040</text>
      </svg>
    );
  }
function calcExtras(rows: ProgressRow[]) {
  return rows.map((row, idx) => {
    const totalValue =
      (row['Actual Value IRA'] ?? 0) + (row['Actual Value Trust'] ?? 0);

    // Last 12 months window (including current)
    const window = rows.slice(Math.max(0, idx - 11), idx + 1);
    const interestSum = window.reduce((s, r) => s + (r['Actual Interest'] ?? 0), 0);
    const avgInterest = window.length ? interestSum / window.length : 0;

    const avgValue =
      window.reduce(
        (s, r) => s + (r['Actual Value IRA'] ?? 0) + (r['Actual Value Trust'] ?? 0),
        0
      ) / (window.length || 1);

    const monthlyAPY =
      totalValue > 0 ? ((row['Actual Interest'] ?? 0) / totalValue) * 12 * 100 : 0;

    const averageAPY = avgValue > 0 ? (interestSum / avgValue) * 100 : 0;

    return {
      ...row,
      totalValue,
      avgInterest,
      monthlyAPY,
      averageAPY,
    };
  });
}

const rowsWithCalcs = calcExtras(progressRows);
  const fields = ['Actual Contribution', 'Actual Interest', 'Actual Value IRA', 'Actual Value Trust'] as const;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">SDLT Progress</h1>
          <a href="/sdlt" className="text-blue-400 hover:underline">← SDLT</a>
        </div>

        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 mb-8">
          <div className="flex items-center gap-4 text-xs mb-2 opacity-70">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 inline-block" /> Actual</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-purple-400 inline-block" /> Trend</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-400 inline-block" /> Goal</span>
          </div>
          <ProgressChart data={chartRows} />
        </div>

        <h2 className="font-semibold mb-3">Monthly Values</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left opacity-70 border-b border-slate-800">
                <th className="py-2 pr-4">Month</th>
                <th className="py-2 pr-4">Actual Contribution</th>
                <th className="py-2 pr-4">Actual Interest</th>
                <th className="py-2 pr-4">Value IRA</th>
                <th className="py-2 pr-4">Value Trust</th>
                <th className="py-2 pr-4">Total Value</th>
                <th className="py-2 pr-4">Avg Interest (12mo)</th>
                <th className="py-2 pr-4">Monthly APY</th>
                <th className="py-2">Avg APY (12mo)</th>
              </tr>
            </thead>
            <tbody>
  {rowsWithCalcs.map((row) => (
    <tr key={row.id} className="border-b border-slate-800/50">
      <td className="py-2 pr-4">{row['End of Month']?.slice(0, 7)}</td>

      {fields.map((field) => (
        <td key={field} className="py-2 pr-4">
          {editing?.id === row.id && editing?.field === field ? (
            <input
              type="number"
              step="0.01"
              autoFocus
              defaultValue={row[field] ?? ''}
              onBlur={(e) => {
                updateProgress(row.id, field, e.target.value);
                setEditing(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
              className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1"
            />
          ) : (
            <span
              onClick={() => setEditing({ id: row.id, field })}
              className="cursor-pointer"
            >
              {row[field] != null
                ? row[field].toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                : '—'}
            </span>
          )}
        </td>
      ))}

      {/* New calculated columns */}
      <td className="py-2 pr-4">
        {row.totalValue
          ? row.totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
          : '—'}
      </td>
      <td className="py-2 pr-4">
        {row.avgInterest
          ? row.avgInterest.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
          : '—'}
      </td>
      <td className="py-2 pr-4">
        {row.monthlyAPY ? row.monthlyAPY.toFixed(2) + '%' : '—'}
      </td>
      <td className="py-2">
        {row.averageAPY ? row.averageAPY.toFixed(2) + '%' : '—'}
      </td>
    </tr>
  ))}
</tbody>
          </table>
        </div>
      </div>
    </main>
  );
}