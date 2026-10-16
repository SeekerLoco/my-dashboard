// Soccer page: referee earnings, mileage, age-group and gender charts, plus venues missing mileage.
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { groupByPeriod, nextLevel, type Level } from '@/lib/drilldown';
import BarChart from '@/components/charts/BarChart';

type Game = {
  id: string;
  Date: string;
  Venue: string;
  'Final Fee': number;
  'Age Group': string;
  Gender: string;
  mileage?: number;
};

export default function SoccerPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [missingVenues, setMissingVenues] = useState<string[]>([]);
  const [earningsLevel, setEarningsLevel] = useState<Level>('year');
  const [earningsFilter, setEarningsFilter] = useState<string | null>(null);
  const [mileageLevel, setMileageLevel] = useState<Level>('year');
  const [mileageFilter, setMileageFilter] = useState<string | null>(null);

  useEffect(() => {
    // Reads Supabase view soccer_games_with_mileage and table soccer_Venues_Mileage
    async function load() {
      const { data } = await supabase
        .from('soccer_games_with_mileage')
        .select('id, Date, Venue, "Final Fee", "Age Group", Gender, mileage');
      if (data) setGames(data);

      // Venues that appear in games but have no row in the mileage table
      // Missing venues
      const { data: venues } = await supabase
        .from('soccer_Venues_Mileage')
        .select('Venue');
      const venueSet = new Set((venues || []).map((v) => v.Venue));
      const missing = [
        ...new Set(
          (data || []).map((g) => g.Venue).filter((v) => v && !venueSet.has(v)),
        ),
      ];
      setMissingVenues(missing);
    }
    load();
  }, []);

  // Totals a field per year/month/day for the drill-down charts
  function groupBy(
    field: 'Final Fee' | 'mileage',
    level: Level,
    filter: string | null,
  ) {
    return groupByPeriod(games, (g) => g.Date || '', level, filter).map(
      ({ key, items }) => ({
        key,
        total: items.reduce((sum, g) => sum + (g[field] || 0), 0),
      }),
    );
  }

  // Age group and gender counts
  const ageCounts: Record<string, number> = {};
  const genderCounts: Record<string, number> = {};
  games.forEach((g) => {
    if (g['Age Group'])
      ageCounts[g['Age Group']] = (ageCounts[g['Age Group']] || 0) + 1;
    if (g.Gender) genderCounts[g.Gender] = (genderCounts[g.Gender] || 0) + 1;
  });
  const ageData = Object.entries(ageCounts)
    .sort(([a], [b]) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB || a.localeCompare(b);
    })
    .map(([key, total]) => ({ key, total }));
  const genderData = Object.entries(genderCounts).map(([key, total]) => ({
    key,
    total,
  }));

  const earningsData = groupBy('Final Fee', earningsLevel, earningsFilter);
  const mileageData = groupBy('mileage', mileageLevel, mileageFilter);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Soccer</h1>
          <a href="/" className="text-blue-400 hover:underline">
            ← Dashboard
          </a>
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
                <button
                  onClick={() => {
                    setEarningsLevel('year');
                    setEarningsFilter(null);
                  }}
                  className="text-xs text-blue-400 hover:underline"
                >
                  ← Back
                </button>
              )}
            </div>
            <BarChart
              data={earningsData}
              onBarClick={(key) => {
                const next = nextLevel(earningsLevel);
                if (next) {
                  setEarningsLevel(next);
                  setEarningsFilter(key);
                }
              }}
            />
          </div>

          {/* Mileage */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">Referee - Mileage</h2>
              {mileageLevel !== 'year' && (
                <button
                  onClick={() => {
                    setMileageLevel('year');
                    setMileageFilter(null);
                  }}
                  className="text-xs text-blue-400 hover:underline"
                >
                  ← Back
                </button>
              )}
            </div>
            <BarChart
              data={mileageData}
              color="#34d399"
              onBarClick={(key) => {
                const next = nextLevel(mileageLevel);
                if (next) {
                  setMileageLevel(next);
                  setMileageFilter(key);
                }
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
