// Usage by Bot card: one bar per bot from the latest bot_usage snapshot for the chosen period.
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Card from '@/components/Card';
import CardTitle from '@/components/CardTitle';
import CardFooter from '@/components/CardFooter';

type Period = 'this_week' | 'last_30_days';
type Row = { bot_name: string; share_pct: number };

const PERIODS: { value: Period; label: string }[] = [
  { value: 'this_week', label: 'This week' },
  { value: 'last_30_days', label: 'Last 30 days' },
];

// "Piper · Personal Executive Assistant" -> "Piper"
function shortName(name: string) {
  return name.split(' · ')[0].trim();
}

function formatMt(iso: string) {
  return (
    new Date(iso).toLocaleString('en-US', {
      timeZone: 'America/Denver',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }) + ' MT'
  );
}

export default function BotUsageCard() {
  const [period, setPeriod] = useState<Period>('this_week');
  const [rows, setRows] = useState<Row[]>([]);
  const [capturedAt, setCapturedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Reads Supabase table bot_usage: latest captured_at for the period, then every row in that snapshot
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: latest } = await supabase
        .from('bot_usage')
        .select('captured_at')
        .eq('period', period)
        .order('captured_at', { ascending: false })
        .limit(1);
      const at = latest?.[0]?.captured_at as string | undefined;
      let snapshot: Row[] = [];
      if (at) {
        const { data } = await supabase
          .from('bot_usage')
          .select('bot_name, share_pct')
          .eq('period', period)
          .eq('captured_at', at);
        snapshot = (data || [])
          .map((r) => ({
            bot_name: r.bot_name as string,
            share_pct: Number(r.share_pct),
          }))
          .sort((a, b) => b.share_pct - a.share_pct);
      }
      if (cancelled) return;
      setRows(snapshot);
      setCapturedAt(at ?? null);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <Card accent="blue">
      <div className="mb-4 flex justify-between items-center gap-2">
        <CardTitle icon="🤖" accent="blue">
          <div className="font-semibold">Usage by Bot</div>
        </CardTitle>
        <div className="flex shrink-0 rounded-lg border border-white/10 bg-white/5 p-0.5 text-xs">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-2 py-1 rounded-md transition ${
                period === p.value
                  ? 'bg-sky-500/70 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 rounded-full bg-white/10" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-sm opacity-70">No usage recorded yet</div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((row, i) => (
            <div key={row.bot_name} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 truncate" title={row.bot_name}>
                {shortName(row.bot_name)}
              </span>
              <div className="flex-1 h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full ${i === 0 ? 'bg-sky-500' : 'bg-sky-300/50'}`}
                  style={{
                    width: `${Math.min(100, Math.max(0, row.share_pct))}%`,
                  }}
                />
              </div>
              <span className="w-12 shrink-0 text-right tabular-nums text-slate-300">
                {row.share_pct.toFixed(row.share_pct < 10 ? 1 : 0)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {capturedAt && <CardFooter>Updated {formatMt(capturedAt)}</CardFooter>}
    </Card>
  );
}
