'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type Transaction = {
  id: string;
  Transaction_Date: string;
  Category: string;
  Type: string;
  Amount: number;
  Status: string;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTx, setNewTx] = useState({
    Transaction_Date: '',
    Category: '',
    Type: 'Debit',
    Amount: '',
    Status: 'Verified',
  });
  const [categories, setCategories] = useState<string[]>([]);

  // Set today's date only on the client
  useEffect(() => {
    setNewTx((prev) => ({
      ...prev,
      Transaction_Date: new Date().toISOString().split('T')[0],
    }));
  }, []);

  async function loadTransactions() {
    setLoading(true);
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 7);
    const end = new Date(today);
    end.setDate(today.getDate() + 7);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('Checkbook_Transactions')
      .select('id, Transaction_Date, Category, Type, Amount, Status')
      .gte('Transaction_Date', startStr)
      .lte('Transaction_Date', endStr)
      .order('Transaction_Date', { ascending: true })
      //.limit(20);
      

    if (error) console.error(error);
    if (data) setTransactions(data);
    setLoading(false);
  }
  
  async function loadCategories() {
        console.log('loadCategories called');
        const { data, error } = await supabase
            .from('Checkbook_CategoryList')
            .select('Category_Name')
            .order('Category_Name');

        console.log('categories data:', data);
        console.log('categories error:', error);

        if (data) {
            setCategories(data.map((row) => row.Category_Name));
        }
    }

    useEffect(() => {
    loadCategories();
    loadTransactions();
    }, []);

  // ... keep the rest of the functions (updateTransaction, deleteTransaction, addTransaction) and the return exactly as they were

  async function updateTransaction(id: string, updates: Partial<Transaction>) {
    await supabase.from('Checkbook_Transactions').update(updates).eq('id', id);
    loadTransactions();
  }

  async function deleteTransaction(id: string) {
    if (!confirm('Delete this transaction?')) return;
    await supabase.from('Checkbook_Transactions').delete().eq('id', id);
    loadTransactions();
  }

  async function addTransaction(e: React.FormEvent) {
  e.preventDefault();
  let amount = parseFloat(newTx.Amount);
  if (!newTx.Category || isNaN(amount)) return;

  // Normalize sign based on Type
  if (newTx.Type === 'Debit' && amount > 0) {
    amount = amount * -1;
  }
  if (newTx.Type === 'Credit' && amount < 0) {
    amount = amount * -1;
  }

  const { data, error } = await supabase.from('Checkbook_Transactions').insert({
    Transaction_Date: newTx.Transaction_Date,
    Category: newTx.Category,
    Type: newTx.Type,
    Amount: amount,
    Status: newTx.Status,
  });

  console.log('insert data:', data);
  console.log('insert error:', error);

  if (!error) {
    setNewTx({
      Transaction_Date: new Date().toISOString().split('T')[0],
      Category: '',
      Type: 'Debit',
      Amount: '',
      Status: 'Verified',
    });
    loadTransactions();
  }
}

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Transactions</h1>
          <a href="/" className="text-blue-400 hover:underline">← Dashboard</a>
        </div>

        {/* Add form */}
        <form onSubmit={addTransaction} className="mb-8 p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="font-semibold mb-3">Add transaction</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <input
              type="date"
              value={newTx.Transaction_Date}
              onChange={(e) => setNewTx({ ...newTx, Transaction_Date: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            />
            <select
                value={newTx.Category}
                onChange={(e) => setNewTx({ ...newTx, Category: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                >
                <option value="">Category</option>
                {categories.map((cat) => (
                    <option key={cat} value={cat}>
                    {cat}
                    </option>
                ))}
            </select>
            <select
              value={newTx.Type}
              onChange={(e) => setNewTx({ ...newTx, Type: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            >
              <option>Debit</option>
              <option>Credit</option>
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              value={newTx.Amount}
              onChange={(e) => setNewTx({ ...newTx, Amount: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            />
            <select
              value={newTx.Status}
              onChange={(e) => setNewTx({ ...newTx, Status: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            >
              <option>Verified</option>
              <option>Expected</option>
            </select>
          </div>
          <button type="submit" className="mt-3 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm">
            Add
          </button>
        </form>

        {/* List */}
        {loading ? (
          <div>Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="opacity-70">No transactions in this window.</div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex flex-wrap items-center gap-3 p-3 bg-slate-900 rounded-lg border border-slate-800">
                <input
                  type="date"
                  defaultValue={tx.Transaction_Date}
                  onBlur={(e) => {
                    if (e.target.value !== tx.Transaction_Date) {
                      updateTransaction(tx.id, { Transaction_Date: e.target.value });
                    }
                  }}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm"
                />
                <span className="w-32 truncate">{tx.Category}</span>
                <span className="w-16 text-sm opacity-70">{tx.Type}</span>
                <span className={`w-24 text-right ${tx.Amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {tx.Amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <select
                  value={tx.Status}
                  onChange={(e) => updateTransaction(tx.id, { Status: e.target.value })}
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