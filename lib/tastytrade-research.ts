// tastytrade Research data: watchlists (edited here), plus the latest screener scan and option chains that TT bot saves to Supabase.
'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Num = number | string | null;

export const num = (v: Num | undefined): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// --- Watchlists ------------------------------------------------------------

export type WatchRow = { id: string; list_name: string; symbol: string };
export type WatchList = { name: string; items: WatchRow[] };

export type WatchState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; lists: WatchList[] };

async function fetchWatchlists(): Promise<WatchState> {
  const { data, error } = await supabase
    .from('tt_watchlists')
    .select('id, list_name, symbol')
    .order('created_at');
  if (error) return { status: 'error', message: error.message };
  const map = new Map<string, WatchRow[]>();
  for (const r of (data ?? []) as WatchRow[]) {
    const arr = map.get(r.list_name) ?? [];
    arr.push(r);
    map.set(r.list_name, arr);
  }
  return {
    status: 'ready',
    lists: [...map].map(([name, items]) => ({ name, items })),
  };
}

export function useWatchlists() {
  const [state, setState] = useState<WatchState>({ status: 'loading' });
  const load = useCallback(async () => setState(await fetchWatchlists()), []);
  useEffect(() => {
    let cancelled = false;
    fetchWatchlists().then((s) => {
      if (!cancelled) setState(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Each returns an error message, or null on success.
  const addSymbol = useCallback(
    async (listName: string, symbol: string): Promise<string | null> => {
      const name = listName.trim();
      const sym = symbol.trim().toUpperCase();
      if (!name) return 'Give the list a name.';
      if (!/^[A-Z0-9.\-^]{1,10}$/.test(sym)) return 'Enter a ticker symbol.';
      const { error } = await supabase
        .from('tt_watchlists')
        .insert({ list_name: name, symbol: sym });
      if (error)
        return error.code === '23505'
          ? `${sym} is already in ${name}.`
          : error.message;
      await load();
      return null;
    },
    [load],
  );
  const removeSymbol = useCallback(
    async (id: string): Promise<string | null> => {
      const { error } = await supabase
        .from('tt_watchlists')
        .delete()
        .eq('id', id);
      if (error) return error.message;
      await load();
      return null;
    },
    [load],
  );
  return { state, addSymbol, removeSymbol };
}

// --- Screener (latest scan) -----------------------------------------------

export type ScanRow = {
  id: string;
  symbol: string;
  price: Num;
  iv: Num;
  iv_rank: Num;
  liquidity_rating: Num;
  next_earnings: string | null;
  option_volume: Num;
  avg_bid_ask_width: Num;
};
export type Scan = {
  id: string;
  as_of: string;
  source: string | null;
  note: string | null;
  rows: ScanRow[];
};
export type ScanInfo = {
  id: string;
  as_of: string;
  source: string | null;
  note: string | null;
};

async function fetchScan(scan: ScanInfo): Promise<Scan | string> {
  const { data: rows, error } = await supabase
    .from('tt_screener_rows')
    .select(
      'id, symbol, price, iv, iv_rank, liquidity_rating, next_earnings, option_volume, avg_bid_ask_width',
    )
    .eq('scan_id', scan.id)
    .limit(1000);
  if (error) return error.message;
  return { ...scan, rows: (rows ?? []) as ScanRow[] };
}

export type ScansState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'none' }
  | { status: 'ready'; scans: ScanInfo[] }; // newest first

// The most recent saved scans (newest first); pick one with useScan.
export function useScanList(): ScansState {
  const [state, setState] = useState<ScansState>({ status: 'loading' });
  useEffect(() => {
    let cancelled = false;
    supabase
      .from('tt_screener_scans')
      .select('id, as_of, source, note')
      .order('as_of', { ascending: false })
      .limit(15)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) return setState({ status: 'error', message: error.message });
        const scans = (data ?? []) as ScanInfo[];
        setState(
          scans.length ? { status: 'ready', scans } : { status: 'none' },
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

export type ScanState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; scan: Scan };

export function useScan(info: ScanInfo | null): ScanState {
  const [loaded, setLoaded] = useState<{ id: string; state: ScanState } | null>(
    null,
  );
  useEffect(() => {
    if (!info) return;
    let cancelled = false;
    fetchScan(info).then((r) => {
      if (cancelled) return;
      setLoaded({
        id: info.id,
        state:
          typeof r === 'string'
            ? { status: 'error', message: r }
            : { status: 'ready', scan: r },
      });
    });
    return () => {
      cancelled = true;
    };
  }, [info]);
  if (!info || loaded?.id !== info.id) return { status: 'loading' };
  return loaded.state;
}

// --- Option chains --------------------------------------------------------

export type ChainSnap = {
  id: string;
  as_of: string;
  symbol: string;
  expiration: string;
  underlying_price: Num;
};
export type ChainRow = {
  id: string;
  strike: Num;
  option_type: string;
  bid: Num;
  ask: Num;
  delta: Num;
  iv: Num;
  open_interest: Num;
  volume: Num;
};
export type SnapsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; snaps: ChainSnap[] }; // newest per symbol + expiration

export function useChainSnapshots(): SnapsState {
  const [state, setState] = useState<SnapsState>({ status: 'loading' });
  useEffect(() => {
    let cancelled = false;
    supabase
      .from('tt_chain_snapshots')
      .select('id, as_of, symbol, expiration, underlying_price')
      .order('as_of', { ascending: false })
      .limit(500)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) return setState({ status: 'error', message: error.message });
        const seen = new Set<string>();
        const snaps: ChainSnap[] = [];
        for (const s of (data ?? []) as ChainSnap[]) {
          const k = `${s.symbol}|${s.expiration}`;
          if (seen.has(k)) continue;
          seen.add(k);
          snaps.push(s);
        }
        setState({ status: 'ready', snaps });
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

export type ChainRowsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; rows: ChainRow[] };

export function useChainRows(chainId: string | null): ChainRowsState {
  const [loaded, setLoaded] = useState<{
    id: string;
    state: ChainRowsState;
  } | null>(null);
  useEffect(() => {
    if (!chainId) return;
    let cancelled = false;
    supabase
      .from('tt_chain_rows')
      .select(
        'id, strike, option_type, bid, ask, delta, iv, open_interest, volume',
      )
      .eq('chain_id', chainId)
      .order('strike')
      .limit(1000)
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoaded({
          id: chainId,
          state: error
            ? { status: 'error', message: error.message }
            : { status: 'ready', rows: (data ?? []) as ChainRow[] },
        });
      });
    return () => {
      cancelled = true;
    };
  }, [chainId]);
  if (!chainId || loaded?.id !== chainId) return { status: 'loading' };
  return loaded.state;
}

// Strikes with their call and put side by side.
export function pivotChain(rows: ChainRow[]) {
  const by = new Map<number, { call?: ChainRow; put?: ChainRow }>();
  for (const r of rows) {
    const k = num(r.strike);
    if (k === null) continue;
    const e = by.get(k) ?? {};
    if (r.option_type === 'call') e.call = r;
    else if (r.option_type === 'put') e.put = r;
    by.set(k, e);
  }
  return [...by]
    .sort((a, b) => a[0] - b[0])
    .map(([strike, v]) => ({ strike, ...v }));
}

// Next earnings date (YYYY-MM-DD) per symbol, from the newest scan that has one for that symbol.
export function useEarningsMap(): Record<string, string> {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: scans } = await supabase
        .from('tt_screener_scans')
        .select('id')
        .order('as_of', { ascending: false })
        .limit(1);
      const id = (scans as { id: string }[] | null)?.[0]?.id;
      if (!id) return;
      const { data: rows } = await supabase
        .from('tt_screener_rows')
        .select('symbol, next_earnings')
        .eq('scan_id', id)
        .not('next_earnings', 'is', null)
        .limit(1000);
      if (cancelled) return;
      const m: Record<string, string> = {};
      for (const r of (rows ?? []) as {
        symbol: string;
        next_earnings: string | null;
      }[]) {
        if (r.next_earnings) m[r.symbol] = r.next_earnings.slice(0, 10);
      }
      setMap(m);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return map;
}
