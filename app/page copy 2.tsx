'use client';

import { useState } from 'react';

export default function Home() {
  const [dark, setDark] = useState(true);

  return (
    <main className={`min-h-screen p-6 transition-colors ${dark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">SeekerLoco Hub</h1>
        <button
          onClick={() => setDark(!dark)}
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
        <div className={`rounded-xl p-5 border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Cary</div>
          <div className="text-4xl font-bold mt-1">72°</div>
          <div className="text-sm mt-2">Clear</div>
        </div>

        {/* Stocks card */}
        <div className={`rounded-xl p-5 border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="font-semibold">S&P 500</div>
          <div className="text-2xl mt-1">7,805</div>
          <div className={`text-sm ${dark ? 'text-red-400' : 'text-red-600'}`}>-6.09</div>
        </div>

        {/* Food diary card */}
        <div className={`rounded-xl p-5 border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="font-semibold">Food diary</div>
          <div className="text-2xl mt-1">1,352</div>
          <div className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>kcal today</div>
        </div>

        {/* Habits card */}
        <div className={`rounded-xl p-5 border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="font-semibold">Habits</div>
          <div className="text-2xl mt-1">0/5</div>
          <div className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>not logged yet</div>
        </div>
      </div>
    </main>
  );
}