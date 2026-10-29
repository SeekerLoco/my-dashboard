// Transactions page: edit and delete checkbook transactions within a date window.
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import { getLocalDateString } from '@/lib/dates';
import { formatUSD } from '@/lib/format';
import DateRangeFilter from '@/components/DateRangeFilter';
import CheckbookProjectionPanel from '@/components/checkbook/CheckbookProjectionPanel';
import RecurringTransactionForm from '@/components/checkbook/RecurringTransactionForm';

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
  const [categories, setCategories] = useState<string[]>([]);
  const [editingAmountId, setEditingAmountId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Default the date window to one week before and after today
  useEffect(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 7);
    const end = new Date(today);
    end.setDate(today.getDate() + 7);

    setStartDate(getLocalDateString(start));
    setEndDate(getLocalDateString(end));
  }, []);

  // Reads Supabase table Checkbook_Transactions for the selected date window
  async function loadTransactions() {
    if (!startDate || !endDate) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('Checkbook_Transactions')
      .select('id, Transaction_Date, Category, Type, Amount, Status')
      .gte('Transaction_Date', startDate)
      .lte('Transaction_Date', endDate)
      .order('Transaction_Date', { ascending: true });

    if (error) console.error(error);
    if (data) setTransactions(data);
    setLoading(false);
  }

  // Reads Supabase table Checkbook_CategoryList for the category dropdown
  async function loadCategories() {
    const { data } = await supabase
      .from('Checkbook_CategoryList')
      .select('Category_Name')
      .order('Category_Name');

    if (data) {
      setCategories(data.map((row) => row.Category_Name));
    }
  }

  useEffect(() => {
    loadCategories();
    loadTransactions();
  }, [startDate, endDate]);

  // Writes one field change to Supabase table Checkbook_Transactions
  async function updateTransaction(id: string, updates: Partial<Transaction>) {
    await supabase.from('Checkbook_Transactions').update(updates).eq('id', id);
    loadTransactions();
  }

  // Deletes a row from Supabase table Checkbook_Transactions (after confirming)
  async function deleteTransaction(id: string) {
    if (!confirm('Delete this transaction?')) return;
    await supabase.from('Checkbook_Transactions').delete().eq('id', id);
    loadTransactions();
  }

  return (
    <main className="min-h-screen text-white p-6">
      <div className="max-w-4xl mx-auto">
        <PageHeader title="Transactions" icon="💵" accent="teal" />

        <CheckbookProjectionPanel />

        <RecurringTransactionForm
          categories={categories}
          onAdded={loadTransactions}
        />

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
          <div className="opacity-70">No transactions in this window.</div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex flex-wrap items-center gap-3 p-3 bg-white/[0.04] rounded-xl border border-white/10"
              >
                <input
                  type="date"
                  defaultValue={tx.Transaction_Date}
                  onBlur={(e) => {
                    if (e.target.value !== tx.Transaction_Date) {
                      updateTransaction(tx.id, {
                        Transaction_Date: e.target.value,
                      });
                    }
                  }}
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
                />
                <span className="w-32 truncate">{tx.Category}</span>
                <span className="w-16 text-sm opacity-70">{tx.Type}</span>
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
                    className={`w-24 text-right bg-white/5 border border-white/10 rounded px-2 py-1 text-sm ${
                      tx.Amount < 0 ? 'text-red-400' : 'text-green-400'
                    }`}
                  />
                ) : (
                  <span
                    onClick={() => setEditingAmountId(tx.id)}
                    className={`w-24 text-right cursor-pointer ${
                      tx.Amount < 0 ? 'text-red-400' : 'text-green-400'
                    }`}
                  >
                    {formatUSD(tx.Amount)}
                  </span>
                )}
                <select
                  value={tx.Status}
                  onChange={(e) =>
                    updateTransaction(tx.id, { Status: e.target.value })
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
