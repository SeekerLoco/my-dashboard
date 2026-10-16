'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type Game = {
  id: string;
  Date: string;
  Venue: string;
  'Final Fee': number;
  'Age Group': string;
  Gender: string;
  mileage?: number;
};

type Level = 'year' | 'month' | 'day';

export default function SoccerPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [missingVenues, setMissingVenues] = useState<string[]>([]);
  const [earningsLevel, setEarningsLevel] = useState<Level>('year');
  const [earningsFilter, setEarningsFilter] = useState<string | null>(null);
  const [mileageLevel, setMileageLevel] = useState<Level>('year');
  const [mileageFilter, setMileageFilter] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('soccer_games_with_mileage')
        .select('id, Date, Venue, "Final Fee", "Age Group", Gender, mileage');
      if (data) setGames(data);

      // Missing venues
      const { data: venues } = await supabase
        .from('soccer_Venues_Mileage')
        .select('Venue');
      const venueSet = new Set((venues || []).map(v => v.Venue));
      const missing = [...new Set(
        (data || [])
          .map(g => g.Venue)
          .filter(v => v && !venueSet.has(v))
      )];
      setMissingVenues(missing);
    console.log('venues from table:', venues);
    console.log('sample game venues:', (data || []).slice(0, 5).map(g => g.Venue));
    
    }
    load();
  }, []);

  function groupBy(field: 'Final Fee' | 'mileage', level: Level, filter: string | null) {
    let filtered = games;
    if (filter) {
      if (level === 'month') filtered = filtered.filter(g => g.Date?.startsWith(filter));
      if (level === 'day') filtered = filtered.filter(g => g.Date?.startsWith(filter));
    }
    const groups: Record<string, number> = {};
    filtered.forEach(g => {
      const d = g.Date || '';
      let key = d.slice(0, 4);
      if (level === 'month') key = d.slice(0, 7);
      if (level === 'day') key = d;
      groups[key] = (groups[key] || 0) + (g[field] || 0);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, total]) => ({ key, total }));
  }

  function BarChart({
    data,
    onBarClick,
    color = '#60a5fa',
  }: {
    data: { key: string; total: number }[];
    onBarClick?: (key: string) => void;
    color?: string;
  }) {
    if (!data.length) return <div className="text-sm opacity-60">No data</div>;
    const max = Math.max(...data.map(d => d.total), 1);
    const barWidth = Math.min(40, 480 / data.length);
    const w = data.length * (barWidth + 12) + 60;
    const h = 220;
    const padL = 50;
    const padB = 30;
    const toY = (v: number) => h - padB - (v / max) * (h - padB - 15);

    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1={padL} y1={15} x2={padL} y2={h - padB} stroke="currentColor" strokeWidth="0.75" opacity="0.4" />
        {[0, max / 2, max].map((tick, i) => (
          <g key={i}>
            <line x1={padL - 4} y1={toY(tick)} x2={padL} y2={toY(tick)} stroke="currentColor" strokeWidth="0.75" opacity="0.4" />
            <text x={padL - 6} y={toY(tick) + 3} textAnchor="end" fontSize="9" fill="currentColor" opacity="0.7">
              {Math.round(tick).toLocaleString()}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = padL + 8 + i * (barWidth + 12);
          const barH = h - padB - toY(d.total);
          return (
            <g key={d.key} onClick={() => onBarClick?.(d.key)} className={onBarClick ? 'cursor-pointer' : ''}>
              <rect x={x} y={toY(d.total)} width={barWidth} height={barH} fill={color} />
              <text x={x + barWidth / 2} y={toY(d.total) - 4} textAnchor="middle" fontSize="8" fill="currentColor">
                {Math.round(d.total).toLocaleString()}
              </text>
              <text x={x + barWidth / 2} y={h - 8} textAnchor="middle" fontSize="9" fill="currentColor">
                {d.key.length > 7 ? d.key.slice(5) : d.key}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // Age groups and gender (simple counts, optionally stacked later)
  const ageCounts: Record<string, number> = {};
  const genderCounts: Record<string, number> = {};
  games.forEach(g => {
    if (g['Age Group']) ageCounts[g['Age Group']] = (ageCounts[g['Age Group']] || 0) + 1;
    if (g.Gender) genderCounts[g.Gender] = (genderCounts[g.Gender] || 0) + 1;
  });
  const ageData = Object.entries(ageCounts)
  .sort(([a], [b]) => {
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    return numA - numB || a.localeCompare(b);
  })
  .map(([key, total]) => ({ key, total }));
  const genderData = Object.entries(genderCounts).map(([key, total]) => ({ key, total }));

  const earningsData = groupBy('Final Fee', earningsLevel, earningsFilter);
  const mileageData = groupBy('mileage', mileageLevel, mileageFilter);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Soccer</h1>
          <a href="/" className="text-blue-400 hover:underline">← Dashboard</a>
        </div>

        {/* Missing venues alert */}
        <div className="mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="font-semibold mb-2">Missing Venues</div>
          {missingVenues.length === 0 ? (
            <div className="text-green-400">✓ OK — all venues have mileage</div>
          ) : (
            <div className="text-yellow-400 text-sm">
              Missing from mileage table: {missingVenues.join(', ')}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Earnings */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">Referee - Earnings</h2>
              {earningsLevel !== 'year' && (
                <button onClick={() => { setEarningsLevel('year'); setEarningsFilter(null); }} className="text-xs text-blue-400 hover:underline">
                  ← Back
                </button>
              )}
            </div>
            <BarChart
              data={earningsData}
              onBarClick={(key) => {
                if (earningsLevel === 'year') { setEarningsLevel('month'); setEarningsFilter(key); }
                else if (earningsLevel === 'month') { setEarningsLevel('day'); setEarningsFilter(key); }
              }}
            />
          </div>

          {/* Mileage */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">Referee - Mileage</h2>
              {mileageLevel !== 'year' && (
                <button onClick={() => { setMileageLevel('year'); setMileageFilter(null); }} className="text-xs text-blue-400 hover:underline">
                  ← Back
                </button>
              )}
            </div>
            <BarChart
              data={mileageData}
              color="#34d399"
              onBarClick={(key) => {
                if (mileageLevel === 'year') { setMileageLevel('month'); setMileageFilter(key); }
                else if (mileageLevel === 'month') { setMileageLevel('day'); setMileageFilter(key); }
              }}
            />
          </div>

          {/* Age Groups */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <h2 className="font-semibold mb-2">Referee - Age Groups</h2>
            <BarChart data={ageData} color="#a78bfa" />
          </div>

          {/* Gender */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <h2 className="font-semibold mb-2">Referee - Gender</h2>
            <BarChart data={genderData} color="#f472b6" />
          </div>
        </div>
      </div>
    </main>
  );
}