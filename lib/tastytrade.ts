// tastytrade live data: reads accounts, latest balance snapshot, and positions from Supabase (RLS: signed-in user only).
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type TtAccount = {
  id: string;
  account_last4: string;
  account_type: string | null;
  environment: string | null;
};

export type TtBalance = {
  id: string;
  account_id: string;
  as_of: string;
  net_liq: number | string | null;
  cash: number | string | null;
  buying_power_equity: number | string | null;
  buying_power_derivative: number | string | null;
};

export type TtPosition = {
  id: string;
  snapshot_id: string;
  symbol: string;
  underlying: string | null;
  instrument_type: string | null;
  quantity: number | string | null;
  direction: string | null;
  expiration: string | null;
  strike: number | string | null;
  option_type: string | null;
  avg_open_price: number | string | null;
  mark: number | string | null;
};

export type TtAccountData = {
  account: TtAccount;
  balance: TtBalance;
  positions: TtPosition[];
};

export type TtState =
  | { status: 'loading' }
  | { status: 'live'; accounts: TtAccountData[] }
  | { status: 'none'; reason: string };

// Separate queries joined in code (no FKs, so no PostgREST embedded joins).
export async function fetchTastytrade(): Promise<TtState> {
  const { data: accounts, error: aErr } = await supabase
    .from('tt_accounts')
    .select('id, account_last4, account_type, environment')
    .order('created_at');
  if (aErr) return { status: 'none', reason: aErr.message };
  if (!accounts?.length) return { status: 'none', reason: 'No accounts' };

  const out: TtAccountData[] = [];
  for (const account of accounts as TtAccount[]) {
    const { data: bal, error: bErr } = await supabase
      .from('tt_balance_snapshots')
      .select(
        'id, account_id, as_of, net_liq, cash, buying_power_equity, buying_power_derivative',
      )
      .eq('account_id', account.id)
      .order('as_of', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (bErr) return { status: 'none', reason: bErr.message };
    if (!bal) continue;
    const { data: pos, error: pErr } = await supabase
      .from('tt_position_snapshots')
      .select(
        'id, snapshot_id, symbol, underlying, instrument_type, quantity, direction, expiration, strike, option_type, avg_open_price, mark',
      )
      .eq('snapshot_id', bal.id);
    if (pErr) return { status: 'none', reason: pErr.message };
    out.push({
      account,
      balance: bal as TtBalance,
      positions: (pos ?? []) as TtPosition[],
    });
  }
  if (!out.length) return { status: 'none', reason: 'No balance snapshots' };
  return { status: 'live', accounts: out };
}

export function useTastytrade(): TtState {
  const [state, setState] = useState<TtState>({ status: 'loading' });
  useEffect(() => {
    fetchTastytrade()
      .then(setState)
      .catch((e: unknown) => setState({ status: 'none', reason: String(e) }));
  }, []);
  return state;
}

export function money(v: number | string | null | undefined): string {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function asOfDenver(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return (
    d.toLocaleString('en-US', {
      timeZone: 'America/Denver',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }) + ' MT'
  );
}

export function envLabel(env: string | null): 'Live' | 'Sandbox' {
  return env?.toLowerCase().startsWith('sand') ? 'Sandbox' : 'Live';
}
