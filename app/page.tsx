// Main dashboard page: theme toggle, auth check, and the grid of cards.
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import WeatherCard from '@/components/cards/WeatherCard';
import MarketsCard from '@/components/cards/MarketsCard';
import CheckbookCard from '@/components/cards/CheckbookCard';
import SdltCard from '@/components/cards/SdltCard';
import HabitsCard from '@/components/cards/HabitsCard';
import SoccerCard from '@/components/cards/SoccerCard';

export default function Home() {
  const [dark, setDark] = useState(true);

  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      }
    });
  }, [router]);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved !== null) setDark(saved === 'dark');
  }, []);

  function toggleTheme() {
    const newDark = !dark;
    setDark(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
  }

  return (
    <main
      className={`min-h-screen p-6 transition-colors ${dark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}
    >
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">SeekerLoco Hub</h1>
        <button
          onClick={toggleTheme}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            dark
              ? 'bg-slate-800 hover:bg-slate-700 text-white'
              : 'bg-white hover:bg-slate-200 text-slate-900 border border-slate-300'
          }`}
        >
          {dark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Weather card */}
        <WeatherCard dark={dark} />

        {/* Stocks card */}
        <MarketsCard dark={dark} />

        {/* Checkbook card */}
        <CheckbookCard dark={dark} />

        {/* SDLT card */}
        <SdltCard dark={dark} />

        {/* Habits card */}
        <HabitsCard dark={dark} />

        {/* Soccer card */}
        <SoccerCard dark={dark} />
      </div>
    </main>
  );
}
