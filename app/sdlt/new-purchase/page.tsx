'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
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
    const freqMap: Record<string, number> = {
      Monthly: 1,
      'Semi-Annually': 6,
      Annually: 12,
      'At-Maturity': 0,
    };
    const monthsStep = freqMap[form.frequency];

    if (monthsStep === 0) {
      // Single interest payment at maturity
      const interest = coupon * redemptionAmount;
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
          <a href="/sdlt" className="text-blue-400 hover:underline">← SDLT</a>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div>
            <label className="block text-sm mb-1">CUSIP / Issue</label>
            <input
              value={form.issue}
              onChange={(e) => setForm({ ...form, issue: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              >
                <option>Bond</option>
                <option>Stock</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Account</label>
              <select
                value={form.account}
                onChange={(e) => setForm({ ...form, account: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              >
                <option>Manutes Trust</option>
                <option>J5Trades</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Purchase Date</label>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Maturity Date</label>
              <input
                type="date"
                value={form.maturityDate}
                onChange={(e) => setForm({ ...form, maturityDate: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Coupon (%)</label>
              <input
                type="number"
                step="0.001"
                value={form.coupon}
                onChange={(e) => setForm({ ...form, coupon: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Frequency</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              >
                <option>Monthly</option>
                <option>Semi-Annually</option>
                <option>Annually</option>
                <option>At-Maturity</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Cost (purchase amount)</label>
              <input
                type="number"
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Capital at Maturity</label>
              <input
                type="number"
                step="0.01"
                value={form.redemptionAmount}
                onChange={(e) => setForm({ ...form, redemptionAmount: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
                required
              />
            </div>
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