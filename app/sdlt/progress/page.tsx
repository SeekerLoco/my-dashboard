// SDLT Progress page: progress-toward-goal chart and an editable table of monthly account values.
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import { getLocalDateString } from '@/lib/dates';
import { formatUSD } from '@/lib/format';
import ProgressChart, {
  type ChartRow,
} from '@/components/charts/ProgressChart';

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
  const [editing, setEditing] = useState<{ id: string; field: string } | null>(
    null,
  );

  // Reads Supabase view sdlt_progress_summary (running total up to today) for the chart
  async function loadChart() {
    const today = getLocalDateString();
    const { data } = await supabase
      .from('sdlt_progress_summary')
      .select('"End of Month", running_actual')
      .lte('End of Month', today)
      .order('End of Month');
    if (data) setChartRows(data);
  }

  // Reads Supabase table SDLT_Progress for the monthly values table
  async function loadProgress() {
    const { data } = await supabase
      .from('SDLT_Progress')
      .select(
        'id, "End of Month", "Actual Contribution", "Actual Interest", "Actual Value IRA", "Actual Value Trust"',
      )
      .order('End of Month');
    if (data) setProgressRows(data);
  }

  useEffect(() => {
    loadChart();
    loadProgress();
  }, []);

  // Writes an edited value to Supabase table SDLT_Progress (blank saves as empty), then reloads
  async function updateProgress(id: string, field: string, value: string) {
    const num = value === '' ? null : parseFloat(value);
    await supabase
      .from('SDLT_Progress')
      .update({ [field]: num })
      .eq('id', id);
    loadProgress();
    loadChart();
  }

  // Adds total value, 12-month average interest, and APY columns to each month
  function calcExtras(rows: ProgressRow[]) {
    return rows.map((row, idx) => {
      const totalValue =
        (row['Actual Value IRA'] ?? 0) + (row['Actual Value Trust'] ?? 0);

      // Last 12 months window (including current)
      const window = rows.slice(Math.max(0, idx - 11), idx + 1);
      const interestSum = window.reduce(
        (s, r) => s + (r['Actual Interest'] ?? 0),
        0,
      );
      const avgInterest = window.length ? interestSum / window.length : 0;

      const avgValue =
        window.reduce(
          (s, r) =>
            s + (r['Actual Value IRA'] ?? 0) + (r['Actual Value Trust'] ?? 0),
          0,
        ) / (window.length || 1);

      // This month's interest as a yearly rate of total value
      const monthlyAPY =
        totalValue > 0
          ? ((row['Actual Interest'] ?? 0) / totalValue) * 12 * 100
          : 0;

      // Last 12 months of interest as a rate of the average value over that period
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
  const fields = [
    'Actual Contribution',
    'Actual Interest',
    'Actual Value IRA',
    'Actual Value Trust',
  ] as const;

  return (
    <main className="min-h-screen text-white p-6">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="SDLT Progress"
          icon="🎯"
          accent="violet"
          backHref="/sdlt"
          backLabel="SDLT"
        />

        <div className="panel p-4 mb-8">
          <div className="flex items-center gap-4 text-xs mb-2 opacity-70">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-blue-400 inline-block" /> Actual
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-purple-400 inline-block" /> Trend
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-red-400 inline-block" /> Goal
            </span>
          </div>
          <ProgressChart data={chartRows} />
        </div>

        <h2 className="font-semibold mb-3">Monthly Values</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left opacity-70 border-b border-white/10">
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
                <tr key={row.id} className="border-b border-white/5">
                  <td className="py-2 pr-4">
                    {row['End of Month']?.slice(0, 7)}
                  </td>

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
                          className="w-24 bg-white/5 border border-white/10 rounded px-2 py-1"
                        />
                      ) : (
                        <span
                          onClick={() => setEditing({ id: row.id, field })}
                          className="cursor-pointer"
                        >
                          {row[field] != null ? formatUSD(row[field]) : '—'}
                        </span>
                      )}
                    </td>
                  ))}

                  {/* Calculated columns */}
                  <td className="py-2 pr-4">
                    {row.totalValue ? formatUSD(row.totalValue) : '—'}
                  </td>
                  <td className="py-2 pr-4">
                    {row.avgInterest ? formatUSD(row.avgInterest) : '—'}
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
