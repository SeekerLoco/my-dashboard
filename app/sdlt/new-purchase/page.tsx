// New Purchase page: enter a bond and create its expected purchase, redemption, and interest rows.
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Field from '@/components/Field';
import { addMonths, getLocalDateString, parseLocalDate } from '@/lib/dates';
import { useRouter } from 'next/navigation';

export default function NewPurchasePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    issue: '',
    type: 'Bond',
    account: 'Manutes Trust',
    purchaseDate: '',
    maturityDate: '',
    coupon: '',
    cost: '',
    redemptionAmount: '',
    frequency: 'Monthly',
  });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Builds the expected rows and inserts them into Supabase table SDLT_Transactions
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const purchaseDate = parseLocalDate(form.purchaseDate);
    const maturityDate = parseLocalDate(form.maturityDate);
    const coupon = parseFloat(form.coupon) / 100;
    const cost = parseFloat(form.cost);
    const redemptionAmount = parseFloat(form.redemptionAmount);

    if (isNaN(coupon) || isNaN(cost) || isNaN(redemptionAmount)) {
      setMessage('Please enter valid numbers.');
      setSaving(false);
      return;
    }

    const rows: any[] = [];

    // Purchase
    rows.push({
      'Action Date': form.purchaseDate,
      Issue: form.issue,
      Type: form.type,
      Account: form.account,
      Action: 'Purchase',
      Amount: -Math.abs(cost),
      Verified: 'Expected',
    });

    // Redemption
    rows.push({
      'Action Date': form.maturityDate,
      Issue: form.issue,
      Type: form.type,
      Account: form.account,
      Action: 'Redemption',
      Amount: Math.abs(redemptionAmount),
      Verified: 'Expected',
    });

    // Interest lines
    // Months between interest payments (0 = one payment at maturity)
    const freqMap: Record<string, number> = {
      Monthly: 1,
      'Semi-Annually': 6,
      Annually: 12,
      'At-Maturity': 0,
    };
    const monthsStep = freqMap[form.frequency];

    if (monthsStep === 0) {
      // Single interest payment at maturity, prorated for the term:
      // face × annual coupon × (days from purchase to maturity / 365)
      // (Math.round on the day count absorbs daylight-saving hour shifts)
      const termDays = Math.round(
        (maturityDate.getTime() - purchaseDate.getTime()) / 86_400_000,
      );
      const interest = redemptionAmount * coupon * (termDays / 365);
      rows.push({
        'Action Date': form.maturityDate,
        Issue: form.issue,
        Type: form.type,
        Account: form.account,
        Action: 'Interest',
        Amount: interest,
        Verified: 'Expected',
      });
    } else {
      // Step back from maturity; each date is computed from maturity so month-end clamping doesn't drift
      let step = 0;
      let current = maturityDate;
      // Each payment is the yearly coupon split across the payments per year
      const interest = (coupon / (12 / monthsStep)) * redemptionAmount;

      while (current > purchaseDate) {
        rows.push({
          'Action Date': getLocalDateString(current),
          Issue: form.issue,
          Type: form.type,
          Account: form.account,
          Action: 'Interest',
          Amount: interest,
          Verified: 'Expected',
        });
        step += 1;
        current = addMonths(maturityDate, -monthsStep * step);
      }
    }

    const { error } = await supabase.from('SDLT_Transactions').insert(rows);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(`Created ${rows.length} expected transactions.`);
      setTimeout(() => router.push('/sdlt'), 1500);
    }
    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">New Purchase</h1>
          <a href="/sdlt" className="text-blue-400 hover:underline">
            ← SDLT
          </a>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-slate-900 p-6 rounded-xl border border-slate-800"
        >
          <Field label="CUSIP / Issue">
            <input
              value={form.issue}
              onChange={(e) => setForm({ ...form, issue: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              >
                <option>Bond</option>
                <option>Stock</option>
              </select>
            </Field>
            <Field label="Account">
              <select
                value={form.account}
                onChange={(e) => setForm({ ...form, account: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              >
                <option>Manutes Trust</option>
                <option>J5Trades</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Purchase Date">
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) =>
                  setForm({ ...form, purchaseDate: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
                required
              />
            </Field>
            <Field label="Maturity Date">
              <input
                type="date"
                value={form.maturityDate}
                onChange={(e) =>
                  setForm({ ...form, maturityDate: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Coupon (%)">
              <input
                type="number"
                step="0.001"
                value={form.coupon}
                onChange={(e) => setForm({ ...form, coupon: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
                required
              />
            </Field>
            <Field label="Frequency">
              <select
                value={form.frequency}
                onChange={(e) =>
                  setForm({ ...form, frequency: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              >
                <option>Monthly</option>
                <option>Semi-Annually</option>
                <option>Annually</option>
                <option>At-Maturity</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Cost (purchase amount)">
              <input
                type="number"
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
                required
              />
            </Field>
            <Field label="Capital at Maturity">
              <input
                type="number"
                step="0.01"
                value={form.redemptionAmount}
                onChange={(e) =>
                  setForm({ ...form, redemptionAmount: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
                required
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Expected Transactions'}
          </button>

          {message && <p className="text-sm mt-2">{message}</p>}
        </form>
      </div>
    </main>
  );
}
