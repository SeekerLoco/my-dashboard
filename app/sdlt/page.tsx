'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
      'Action Date': new Date().toISOString().split('T')[0],
    }));
  }, []);

  useEffect(() => {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 15);
  const end = new Date(today);
  end.setDate(today.getDate() + 15);

  const toLocal = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  setStartDate(toLocal(start));
  setEndDate(toLocal(end));
}, []);

  async function loadTransactions() {
    if(!startDate || !endDate) return;
    setLoading(true);
    
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 15);
    const end = new Date(today);
    end.setDate(today.getDate() + 15);
    
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

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

  async function updateTransaction(id: string, updates: Partial<SDLTTransaction>) {
    await supabase.from('SDLT_Transactions').update(updates).eq('id', id);
    loadTransactions();
  }

  async function deleteTransaction(id: string) {
    if (!confirm('Delete this transaction?')) return;
    await supabase.from('SDLT_Transactions').delete().eq('id', id);
    loadTransactions();
  }

  async function addTransaction(e: React.FormEvent) {
    e.preventDefault();
    let amount = parseFloat(newTx.Amount);
    if (isNaN(amount)) return;

    // Optional: normalize sign if you want (similar to checkbook)
    // For now we save exactly what is entered

    const { error } = await supabase.from('SDLT_Transactions').insert({
      'Action Date': newTx['Action Date'],
      Action: newTx.Action,
      Amount: amount,
    });

    if (!error) {
      setNewTx({
        'Action Date': new Date().toISOString().split('T')[0],
        Action: 'Redemption',
        Amount: '',
      });
      loadTransactions();
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">SDLT</h1>
          <a href="/" className="text-blue-400 hover:underline">← Dashboard</a>
        </div>

        {/* Header links for future pages */}
        <div className="flex gap-4 mb-6 text-sm">
          <a href="/sdlt/charts" className="hover:underline opacity-70">| Charts</a>
          <a href="/sdlt/progress" className="hover:underline opacity-70">| Progress</a>
          <a href="/sdlt/new-purchase" className="hover:underline opacity-70">| New Purchase</a>
        </div>

        {/* Add form */}
        <form onSubmit={addTransaction} className="mb-8 p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="font-semibold mb-3">Add transaction</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              type="date"
              value={newTx['Action Date']}
              onChange={(e) => setNewTx({ ...newTx, 'Action Date': e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            />
            <select
              value={newTx.Action}
              onChange={(e) => setNewTx({ ...newTx, Action: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
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
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            />
            <button type="submit" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm">
              Add
            </button>
          </div>
        </form>

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

        {/* List */}
        {loading ? (
          <div>Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="opacity-70">No transactions yet.</div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex flex-wrap items-center gap-3 p-3 bg-slate-900 rounded-lg border border-slate-800">
                <input
                  type="date"
                  defaultValue={tx['Action Date']}
                  onBlur={(e) => {
                    if (e.target.value !== tx['Action Date']) {
                      updateTransaction(tx.id, { 'Action Date': e.target.value });
                    }
                  }}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm"
                />
                <span className="w-28">{tx.Action}</span>

                <span className="w-40 truncate text-sm opacity-90">{tx.Issue}</span>

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
                    className="w-28 text-right bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm"
                  />
                ) : (
                <span
                    onClick={() => setEditingAmountId(tx.id)}
                    className="w-28 text-right cursor-pointer"
                >
                    {tx.Amount.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    })}
                </span>
                )}

                

                <select
                value={tx.Verified}
                onChange={(e) => updateTransaction(tx.id, { Verified: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm"
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