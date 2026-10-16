// SDLT page: add, edit, and delete SDLT (bond/interest) transactions within a date window.
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dates';
import { formatUSD } from '@/lib/format';
import DateRangeFilter from '@/components/DateRangeFilter';

type SDLTTransaction = {
  id: string;
  'Action Date': string;
  Action: string;
  Amount: number;
  Verified: string;
  Issue: string;
};

export default function SDLTPage() {
  const [transactions, setTransactions] = useState<SDLTTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAmountId, setEditingAmountId] = useState<string | null>(null);
  const [newTx, setNewTx] = useState({
    'Action Date': '',
    Action: 'Redemption',
    Amount: '',
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    setNewTx((prev) => ({
      ...prev,
      'Action Date': getLocalDateString(),
    }));
  }, []);

  // Default the date window to 15 days before and after today
  useEffect(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 15);
    const end = new Date(today);
    end.setDate(today.getDate() + 15);

    setStartDate(getLocalDateString(start));
    setEndDate(getLocalDateString(end));
  }, []);

  // Reads Supabase table SDLT_Transactions for the selected date window
  async function loadTransactions() {
    if (!startDate || !endDate) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('SDLT_Transactions')
      .select('id, "Action Date", Action, Amount, Verified, Issue')
      .gte('Action Date', startDate)
      .lte('Action Date', endDate)
      .order('Action Date', { ascending: true });

    if (error) console.error('SDLT load error:', error.message, error);
    if (data) setTransactions(data);
    setLoading(false);
  }

  useEffect(() => {
    loadTransactions();
  }, [startDate, endDate]);

  // Writes one field change to Supabase table SDLT_Transactions
  async function updateTransaction(
    id: string,
    updates: Partial<SDLTTransaction>,
  ) {
    await supabase.from('SDLT_Transactions').update(updates).eq('id', id);
    loadTransactions();
  }

  // Deletes a row from Supabase table SDLT_Transactions (after confirming)
  async function deleteTransaction(id: string) {
    if (!confirm('Delete this transaction?')) return;
    await supabase.from('SDLT_Transactions').delete().eq('id', id);
    loadTransactions();
  }

  // Inserts a new row into Supabase table SDLT_Transactions (amount saved as entered)
  async function addTransaction(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(newTx.Amount);
    if (isNaN(amount)) return;

    const { error } = await supabase.from('SDLT_Transactions').insert({
      'Action Date': newTx['Action Date'],
      Action: newTx.Action,
      Amount: amount,
    });

    if (!error) {
      setNewTx({
        'Action Date': getLocalDateString(),
        Action: 'Redemption',
        Amount: '',
      });
      loadTransactions();
    }
  }

  return (
    <main className="min-h-screen text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">SDLT</h1>
          <a href="/" className="text-blue-400 hover:underline">
            ← Dashboard
          </a>
        </div>

        {/* Links to SDLT sub-pages */}
        <div className="flex gap-4 mb-6 text-sm">
          <a href="/sdlt/charts" className="hover:underline opacity-70">
            | Charts
          </a>
          <a href="/sdlt/progress" className="hover:underline opacity-70">
            | Progress
          </a>
          <a href="/sdlt/new-purchase" className="hover:underline opacity-70">
            | New Purchase
          </a>
        </div>

        {/* Add form */}
        <form onSubmit={addTransaction} className="panel mb-8 p-4">
          <div className="font-semibold mb-3">Add transaction</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              type="date"
              value={newTx['Action Date']}
              onChange={(e) =>
                setNewTx({ ...newTx, 'Action Date': e.target.value })
              }
              className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
            />
            <select
              value={newTx.Action}
              onChange={(e) => setNewTx({ ...newTx, Action: e.target.value })}
              className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
            >
              <option>Redemption</option>
              <option>Interest</option>
              <option>Contribution</option>
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              value={newTx.Amount}
              onChange={(e) => setNewTx({ ...newTx, Amount: e.target.value })}
              className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-500/70 hover:bg-indigo-500 rounded text-sm"
            >
              Add
            </button>
          </div>
        </form>

        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
        />

        {/* List */}
        {loading ? (
          <div>Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="opacity-70">No transactions yet.</div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex flex-wrap items-center gap-3 p-3 bg-white/[0.04] rounded-xl border border-white/10"
              >
                <input
                  type="date"
                  defaultValue={tx['Action Date']}
                  onBlur={(e) => {
                    if (e.target.value !== tx['Action Date']) {
                      updateTransaction(tx.id, {
                        'Action Date': e.target.value,
                      });
                    }
                  }}
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
                />
                <span className="w-28">{tx.Action}</span>

                <span className="w-40 truncate text-sm opacity-90">
                  {tx.Issue}
                </span>

                {editingAmountId === tx.id ? (
                  <input
                    type="number"
                    step="0.01"
                    autoFocus
                    defaultValue={tx.Amount}
                    onBlur={(e) => {
                      const newAmount = parseFloat(e.target.value);
                      if (!isNaN(newAmount) && newAmount !== tx.Amount) {
                        updateTransaction(tx.id, { Amount: newAmount });
                      }
                      setEditingAmountId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                    }}
                    className="w-28 text-right bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
                  />
                ) : (
                  <span
                    onClick={() => setEditingAmountId(tx.id)}
                    className="w-28 text-right cursor-pointer"
                  >
                    {formatUSD(tx.Amount)}
                  </span>
                )}

                <select
                  value={tx.Verified}
                  onChange={(e) =>
                    updateTransaction(tx.id, { Verified: e.target.value })
                  }
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
                >
                  <option>Expected</option>
                  <option>Verified</option>
                </select>

                <button
                  onClick={() => deleteTransaction(tx.id)}
                  className="ml-auto text-red-400 hover:text-red-300 text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
