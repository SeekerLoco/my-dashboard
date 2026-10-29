// "New Transaction" planner on the Transactions page: creates one or a series of Expected
// rows in Supabase Checkbook_Transactions between a start and end date at a chosen frequency.
'use client';

import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatUSD } from '@/lib/format';

type Frequency = 'One Time' | 'Weekly' | 'Bi-Weekly' | 'Monthly';
const FREQUENCIES: Frequency[] = ['One Time', 'Weekly', 'Bi-Weekly', 'Monthly'];

const INPUT =
  'w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm';

function parse(d: string): Date {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day);
}

function fmt(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Every date from start through end at the frequency. Monthly keeps the start's day of
// month, moving to the month's last day when that month is shorter (Jan 31 → Feb 28).
export function scheduleDates(
  start: string,
  end: string,
  freq: Frequency,
): string[] {
  if (!start) return [];
  if (freq === 'One Time') return [start];
  if (!end || end < start) return [];
  const s = parse(start);
  const e = parse(end);
  const out: string[] = [];
  for (let i = 0; i < 1000; i++) {
    let d: Date;
    if (freq === 'Monthly') {
      const y = s.getFullYear();
      const m = s.getMonth() + i;
      const last = new Date(y, m + 1, 0).getDate();
      d = new Date(y, m, Math.min(s.getDate(), last));
    } else {
      d = new Date(s);
      d.setDate(s.getDate() + i * (freq === 'Weekly' ? 7 : 14));
    }
    if (d > e) break;
    out.push(fmt(d));
  }
  return out;
}

export default function RecurringTransactionForm({
  categories,
  onAdded,
}: {
  categories: string[];
  onAdded: () => void;
}) {
  const [start, setStart] = useState('2027-01-01');
  const [end, setEnd] = useState('2027-12-31');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'Debit' | 'Credit'>('Debit');
  const [amount, setAmount] = useState('');
  const [freq, setFreq] = useState<Frequency>('Monthly');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const dates = useMemo(
    () => scheduleDates(start, end, freq),
    [start, end, freq],
  );
  const value = Math.abs(parseFloat(amount));
  const signed = type === 'Debit' ? -value : value;
  const valid =
    !!category && Number.isFinite(value) && value > 0 && dates.length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!valid) {
      setMsg({
        ok: false,
        text: 'Pick a category, an amount, and valid dates.',
      });
      return;
    }
    if (
      dates.length > 1 &&
      !confirm(
        `Add ${dates.length} Expected ${category} ${type.toLowerCase()}s of ${formatUSD(value)}, ${dates[0]} through ${dates[dates.length - 1]}?`,
      )
    )
      return;
    setSaving(true);
    const { error } = await supabase.from('Checkbook_Transactions').insert(
      dates.map((d) => ({
        Transaction_Date: d,
        Category: category,
        Type: type,
        Amount: signed,
        Status: 'Expected',
      })),
    );
    setSaving(false);
    if (error) {
      setMsg({ ok: false, text: `Couldn’t save: ${error.message}` });
      return;
    }
    setMsg({
      ok: true,
      text: `Added ${dates.length} Expected transaction${dates.length === 1 ? '' : 's'}.`,
    });
    setAmount('');
    onAdded();
  }

  return (
    <form onSubmit={submit} className="panel mb-8 p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 font-semibold hover:text-white/80"
      >
        <span
          className={`inline-block transition-transform ${open ? 'rotate-90' : ''}`}
        >
          ▸
        </span>
        New Transaction
      </button>
      {open && (
        <>
          <p className="text-xs text-white/60 mt-2 mb-3">
            Plan one-time or repeating transactions. Every row is saved as
            Expected.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <label className="text-xs text-white/60 space-y-1">
              <span>Start date (first transaction)</span>
              <input
                type="date"
                className={INPUT}
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label className="text-xs text-white/60 space-y-1">
              <span>End date (last transaction)</span>
              <input
                type="date"
                className={`${INPUT} disabled:opacity-40`}
                value={end}
                disabled={freq === 'One Time'}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
            <label className="text-xs text-white/60 space-y-1">
              <span>Frequency</span>
              <select
                className={INPUT}
                value={freq}
                onChange={(e) => setFreq(e.target.value as Frequency)}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-white/60 space-y-1">
              <span>Category</span>
              <select
                className={INPUT}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Category</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-white/60 space-y-1">
              <span>Debit or Credit</span>
              <select
                className={INPUT}
                value={type}
                onChange={(e) => setType(e.target.value as 'Debit' | 'Credit')}
              >
                <option>Debit</option>
                <option>Credit</option>
              </select>
            </label>
            <label className="text-xs text-white/60 space-y-1">
              <span>Amount (each)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className={INPUT}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
          </div>
          <p className="text-xs text-white/60 mt-3">
            {dates.length === 0
              ? 'End date must be on or after the start date.'
              : `${dates.length} transaction${dates.length === 1 ? '' : 's'}${
                  dates.length > 1
                    ? `, ${dates[0]} through ${dates[dates.length - 1]}`
                    : ` on ${dates[0]}`
                }${
                  Number.isFinite(value) && value > 0
                    ? ` · total ${formatUSD(signed * dates.length)}`
                    : ''
                }`}
          </p>
          {msg && (
            <p
              className={`text-sm mt-2 ${msg.ok ? 'text-green-400' : 'text-red-300'}`}
            >
              {msg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="mt-3 px-4 py-2 bg-indigo-500/70 hover:bg-indigo-500 rounded text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Add to plan'}
          </button>
        </>
      )}
    </form>
  );
}
