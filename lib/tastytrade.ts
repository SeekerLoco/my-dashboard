// tastytrade live data: reads accounts, latest balance snapshot, and positions from Supabase (RLS: signed-in user only).
'use client';

import { useCallback, useEffect, useState } from 'react';
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

// --- Account value history -------------------------------------------------

export type TtBalancePoint = { as_of: string; net_liq: number };

export type TtHistoryState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; byAccount: Record<string, TtBalancePoint[]> };

const PAGE = 1000;

// All balance snapshots for one account, as_of ascending (paged past the API row cap).
export async function fetchBalanceHistory(
  accountId: string,
): Promise<TtBalancePoint[]> {
  const out: TtBalancePoint[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('tt_balance_snapshots')
      .select('as_of, net_liq')
      .eq('account_id', accountId)
      .order('as_of', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    for (const r of data ?? []) {
      const v = r.net_liq === null ? NaN : Number(r.net_liq);
      if (Number.isFinite(v))
        out.push({ as_of: r.as_of as string, net_liq: v });
    }
    if (!data || data.length < PAGE) break;
  }
  return out;
}

export function useBalanceHistory(accountIds: string[]): TtHistoryState {
  const [state, setState] = useState<TtHistoryState>({ status: 'loading' });
  const key = accountIds.join(',');
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      key
        .split(',')
        .filter(Boolean)
        .map(async (id) => [id, await fetchBalanceHistory(id)] as const),
    )
      .then((rows) => {
        if (!cancelled)
          setState({ status: 'ready', byAccount: Object.fromEntries(rows) });
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setState({
            status: 'error',
            message: e instanceof Error ? e.message : String(e),
          });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);
  return state;
}

// Denver calendar day (YYYY-MM-DD) of an ISO timestamp.
export function denverDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    timeZone: 'America/Denver',
  });
}

// Newest net liq minus the first snapshot of the same Denver day; null if that day has only one snapshot.
export function dayPnl(points: TtBalancePoint[]): number | null {
  if (points.length < 2) return null;
  const last = points[points.length - 1];
  const day = denverDay(last.as_of);
  const first = points.find((p) => denverDay(p.as_of) === day);
  if (!first || first === last) return null;
  return last.net_liq - first.net_liq;
}

// --- Trade journal (tt_trades) --------------------------------------------

export type TtTradeStatus = 'open' | 'closed' | 'expired';

export type TtLeg = {
  direction: 'buy' | 'sell';
  quantity: number;
  option_type: 'put' | 'call';
  strike: number;
  expiration: string;
};

export type TtTrade = {
  id: string;
  account_id: string | null;
  opened_at: string | null;
  closed_at: string | null;
  status: TtTradeStatus;
  underlying: string | null;
  strategy: string | null;
  legs: TtLeg[] | null;
  contracts: number | null;
  entry_price: number | string | null;
  max_loss: number | string | null;
  max_profit: number | string | null;
  exit_price: number | string | null;
  fees: number | string | null;
  realized_pnl: number | string | null;
  thesis: string | null;
  lesson: string | null;
  created_at: string;
};

// Fields Johnny can enter when adding a trade by hand.
export type TtTradeInput = Omit<TtTrade, 'id' | 'created_at'>;

export type TtTradesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; trades: TtTrade[] };

const TRADE_COLS =
  'id, account_id, opened_at, closed_at, status, underlying, strategy, legs, contracts, entry_price, max_loss, max_profit, exit_price, fees, realized_pnl, thesis, lesson, created_at';

async function fetchTrades(): Promise<TtTradesState> {
  const { data, error } = await supabase
    .from('tt_trades')
    .select(TRADE_COLS)
    .order('opened_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) return { status: 'error', message: error.message };
  return { status: 'ready', trades: (data ?? []) as TtTrade[] };
}

export function useTradeJournal() {
  const [state, setState] = useState<TtTradesState>({ status: 'loading' });

  const load = useCallback(async () => {
    setState(await fetchTrades());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchTrades().then((s) => {
      if (!cancelled) setState(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Returns an error message, or null on success.
  const addTrade = useCallback(
    async (input: TtTradeInput): Promise<string | null> => {
      const { error } = await supabase.from('tt_trades').insert(input);
      if (error) return error.message;
      await load();
      return null;
    },
    [load],
  );

  const updateNotes = useCallback(
    async (
      id: string,
      notes: { thesis: string | null; lesson: string | null },
    ): Promise<string | null> => {
      const { error } = await supabase
        .from('tt_trades')
        .update(notes)
        .eq('id', id);
      if (error) return error.message;
      await load();
      return null;
    },
    [load],
  );

  return { state, reload: load, addTrade, updateNotes };
}

// Denver wall-clock "YYYY-MM-DDTHH:mm" (from a datetime-local input) to a UTC ISO string.
export function denverLocalToIso(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  // Find the Denver offset at that moment (re-check once to handle DST edges).
  let guess = asUtc;
  for (let i = 0; i < 2; i++) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Denver',
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).formatToParts(new Date(guess));
    const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const shown = Date.UTC(
      g('year'),
      g('month') - 1,
      g('day'),
      g('hour'),
      g('minute'),
    );
    guess = guess - (shown - asUtc);
  }
  return new Date(guess).toISOString();
}

// Short MT date for journal rows, e.g. "Oct 23, 2026".
export function dateDenver(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    timeZone: 'America/Denver',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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
