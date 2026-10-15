'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

function getWeatherInfo(code: number) {
  if (code === 0) return { label: 'Clear', icon: '☀️' };
  if (code >= 1 && code <= 3) return { label: 'Partly cloudy', icon: '⛅' };
  if (code >= 45 && code <= 48) return { label: 'Fog', icon: '🌫️' };
  if (code >= 51 && code <= 67) return { label: 'Rain', icon: '🌧️' };
  if (code >= 71 && code <= 77) return { label: 'Snow', icon: '❄️' };
  if (code >= 80 && code <= 82) return { label: 'Rain showers', icon: '🌦️' };
  if (code >= 85 && code <= 86) return { label: 'Snow showers', icon: '🌨️' };
  if (code >= 95) return { label: 'Thunderstorm', icon: '⛈️' };
  return { label: 'Unknown', icon: '❓' };
}

const DEFAULT_LAT = 39.55;
const DEFAULT_LON = -104.97;
const DEFAULT_NAME = 'Highlands Ranch';

const STOCK_SYMBOLS = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^DJI', name: 'Dow Jones' },
  { symbol: '^IXIC', name: 'Nasdaq' },
  { symbol: 'GC=F', name: 'Gold' },
  { symbol: 'SI=F', name: 'Silver' },
  { symbol: 'SPCX', name: 'SPCX' },
];



type StockQuote = {
  name: string;
  price: number;
  change: number;
  changePercent: number;
  history: number[];
};

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 20;

  // Opening / reference price is the first point
  const open = data[0];
  const openY = height - ((open - min) / range) * height;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="inline-block ml-2">
      {/* Dotted line at opening price */}
      <line
        x1="0"
        y1={openY}
        x2={width}
        y2={openY}
        stroke={positive ? '#4ade80' : '#f87171'}
        strokeWidth="0.75"
        strokeDasharray="2 2"
        opacity="0.6"
      />
      {/* Price line */}
      <polyline
        fill="none"
        stroke={positive ? '#4ade80' : '#f87171'}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}

function ProjectionChart({ data }: { data: { date: string; balance: number }[] }) {
  if (!data || data.length < 2) return null;

  const width = 280;
  const height = 90;
  const paddingLeft = 36;
  const paddingRight = 8;
  const paddingTop = 8;
  const paddingBottom = 8;

  const balances = data.map(d => d.balance);
  const min = Math.min(...balances, 0);
  const max = Math.max(...balances, 0);
  const range = max - min || 1;

  const toX = (i: number) =>
    paddingLeft + (i / (data.length - 1)) * (width - paddingLeft - paddingRight);
  const toY = (val: number) =>
    paddingTop + (1 - (val - min) / range) * (height - paddingTop - paddingBottom);

  const points = data.map((d, i) => `${toX(i)},${toY(d.balance)}`).join(' ');
  const zeroY = toY(0);

  // First date the balance goes below zero
  const firstNegative = data.find(d => d.balance < 0);
  const firstNegativeIndex = firstNegative ? data.indexOf(firstNegative) : -1;

  // Simple tick values
  const ticks = [max, 0, min].filter((v, i, arr) => arr.indexOf(v) === i);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="mt-3">
      {/* Y-axis line */}
      <line
        x1={paddingLeft}
        y1={paddingTop}
        x2={paddingLeft}
        y2={height - paddingBottom}
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.5"
      />

      {/* Ticks and labels */}
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={paddingLeft - 4}
            y1={toY(tick)}
            x2={paddingLeft}
            y2={toY(tick)}
            stroke="currentColor"
            strokeWidth="0.75"
            opacity="0.5"
          />
          <text
            x={paddingLeft - 6}
            y={toY(tick) + 3}
            textAnchor="end"
            fontSize="8"
            fill="currentColor"
            opacity="0.7"
          >
            {tick >= 1000 || tick <= -1000 ? `${(tick / 1000).toFixed(1)}k` : Math.round(tick)}
          </text>
        </g>
      ))}

      {/* Zero line */}
      <line
        x1={paddingLeft}
        y1={zeroY}
        x2={width - paddingRight}
        y2={zeroY}
        stroke="currentColor"
        strokeWidth="0.5"
        strokeDasharray="2 2"
        opacity="0.4"
      />

      {/* Balance line */}
      <polyline
        fill="none"
        stroke="#60a5fa"
        strokeWidth="1.5"
        points={points}
      />

      {/* First negative date label */}
    {firstNegative && firstNegativeIndex >= 0 && (
      <text
        x={toX(firstNegativeIndex)}
        y={toY(firstNegative.balance) - 6}
        textAnchor="middle"
        fontSize="8"
        fill="#f87171"
    >
      {new Date(firstNegative.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
    </text>
)}
    </svg>
  );
}

export default function Home() {
  const [dark, setDark] = useState(true);
  const [locationName, setLocationName] = useState(DEFAULT_NAME);
  const [searchInput, setSearchInput] = useState('');
  const [weather, setWeather] = useState<{
    temp: number;
    description: string;
    icon: string;
    high: number;
    low: number;
    forecast: { day: string; high: number; low: number; icon: string; label: string }[];
  } | null>(null);
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [stocksUpdatedAt, setStocksUpdatedAt] = useState<string | null>(null);
  const [habits, setHabits] = useState<{ id: string; name: string }[]>([]);
  const [todayCompletions, setTodayCompletions] = useState<string[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [showBalance, setShowBalance] = useState(false);
  const [checkbookBalance, setCheckbookBalance] = useState<number | null>(null);
  const [projection, setProjection] = useState<{ date: string; balance: number }[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved !== null) setDark(saved === 'dark');
  }, []);

  async function fetchWeather(lat: number, lon: number, name: string) {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=fahrenheit&timezone=auto&forecast_days=4`
    );
    const data = await res.json();

    const currentInfo = getWeatherInfo(data.current.weather_code);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const forecast = data.daily.time.slice(1, 4).map((dateStr: string, i: number) => {
      const date = new Date(dateStr);
      const info = getWeatherInfo(data.daily.weather_code[i + 1]);
      return {
        day: days[date.getDay()],
        high: Math.round(data.daily.temperature_2m_max[i + 1]),
        low: Math.round(data.daily.temperature_2m_min[i + 1]),
        icon: info.icon,
        label: info.label,
      };
    });

    setWeather({
      temp: Math.round(data.current.temperature_2m),
      description: currentInfo.label,
      icon: currentInfo.icon,
      high: Math.round(data.daily.temperature_2m_max[0]),
      low: Math.round(data.daily.temperature_2m_min[0]),
      forecast,
    });
    setLocationName(name);
  }

  useEffect(() => {
    fetchWeather(DEFAULT_LAT, DEFAULT_LON, DEFAULT_NAME);
  }, []);

    // Fetch stock quotes from our own API route
  async function fetchStocks() {
    try {
      const res = await fetch('/api/stocks');
      const data = await res.json();
      setStocks(data.quotes);
      setStocksUpdatedAt(data.updatedAt);
    } catch (err) {
      console.error('Failed to load stocks', err);
    }
  }

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
{/* Checkbook card */}
<div className={`rounded-xl p-5 border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
  <div className="flex justify-between items-center mb-2">
    <a
      href="/transactions"
      className="font-semibold hover:underline"
    >
      Checkbook
    </a>
    <button
      onClick={() => setShowBalance(!showBalance)}
      title={showBalance ? 'Hide balance' : 'Show balance'}
      className={`w-7 h-7 flex items-center justify-center rounded-md text-sm ${
        dark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'
      }`}
    >
      {showBalance ? '👁️' : '👁️‍🗨️'}
    </button>
  </div>

  <div className="text-3xl font-bold mt-1">
    {showBalance ? '$6.00' : '******'}
  </div>
  <div className={`text-sm mt-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
    Verified balance
  </div>
</div>

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchInput.trim()) return;

    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchInput)}&count=1&language=en&format=json`
    );
    const geoData = await geoRes.json();

    if (geoData.results && geoData.results.length > 0) {
      const place = geoData.results[0];
      fetchWeather(place.latitude, place.longitude, place.name);
      setSearchInput('');
    } else {
      alert('Location not found. Try a different spelling.');
    }
  }

  function goHome() {
    fetchWeather(DEFAULT_LAT, DEFAULT_LON, DEFAULT_NAME);
    setSearchInput('');
  }

  function toggleTheme() {
    const newDark = !dark;
    setDark(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
  }


    // Load habits and today's completions
    
  async function loadHabits() {
    const { data: habitsData } = await supabase.from('habits').select('id, name').eq('active', true).order('created_at');
    setHabits(habitsData || []);

    const today = new Date().toISOString().split('T')[0];
    const { data: completionsData } = await supabase
      .from('habits_completions')
      .select('habit_id')
      .eq('completed_date', today);

    setTodayCompletions(completionsData?.map(c => c.habit_id) || []);
  }

  useEffect(() => {
    loadHabits();
  }, []);

  async function toggleHabit(habitId: string) {
    const today = new Date().toISOString().split('T')[0];
    const isCompleted = todayCompletions.includes(habitId);

    if (isCompleted) {
      await supabase
        .from('habits_completions')
        .delete()
        .eq('habit_id', habitId)
        .eq('completed_date', today);
    } else {
      await supabase
        .from('habits_completions')
        .insert({ habit_id: habitId, completed_date: today });
    }

    loadHabits(); // refresh
  }

  async function addHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    await supabase.from('habits').insert({ name: newHabitName.trim() });
    setNewHabitName('');
    loadHabits();
  }

   async function archiveHabit(habitId: string) {
    await supabase.from('habits').update({ active: false }).eq('id', habitId);
    loadHabits();
  }
  
  async function fetchCheckbookBalance() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('daily_balances')
      .select('verified_balance')
      .eq('calendar_date', today)
      .single();

    if (!error && data) {
      setCheckbookBalance(data.verified_balance);
    }
  }


  async function fetchProjection() {
    const today = new Date().toISOString().split('T')[0];
    const end = new Date();
    end.setDate(end.getDate() + 90);
    const endStr = end.toISOString().split('T')[0];

    const { data } = await supabase
      .from('daily_balances')
      .select('calendar_date, projected_balance')
      .gte('calendar_date', today)
      .lte('calendar_date', endStr)
      .order('calendar_date');

    if (data) {
      setProjection(data.map(row => ({
        date: row.calendar_date,
        balance: row.projected_balance,
      })));
    }
  }
    useEffect(() => {
      fetchCheckbookBalance();
      fetchProjection();
  }, []);

  return (
    <main className={`min-h-screen p-6 transition-colors ${dark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
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
        <div className={`rounded-xl p-5 border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <form onSubmit={handleSearch} className="mb-3 flex items-center gap-1.5">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search city..."
              className={`flex-1 min-w-0 px-3 py-1.5 rounded-md border text-sm ${
                dark
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
              }`}
            />
            <button
              type="submit"
              title="Search"
              className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-sm ${
                dark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'
              }`}
            >
              🔍
            </button>
            <button
              type="button"
              onClick={goHome}
              title="Reset to Highlands Ranch"
              className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-sm ${
                dark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'
              }`}
            >
              🏠
            </button>
          </form>

          <div className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{locationName}</div>

          {weather ? (
            <>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-5xl">{weather.icon}</span>
                <div>
                  <div className="text-4xl font-bold">{weather.temp}°</div>
                  <div className="text-sm">{weather.description}</div>
                </div>
              </div>

              <div className={`text-sm mt-3 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                H: {weather.high}° &nbsp; L: {weather.low}°
              </div>

              <div className="mt-4 space-y-2 text-sm">
                {weather.forecast.map((day) => (
                  <div key={day.day} className="flex items-center justify-between">
                    <span className="w-10">{day.day}</span>
                    <span className="text-lg">{day.icon}</span>
                    <span className="flex-1 text-right">
                      {day.high}° / {day.low}°
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-2">Loading...</div>
          )}
        </div>

                {/* Stocks card */}
        <div className={`rounded-xl p-5 border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-center mb-3">
            <a
              href="https://finviz.com/futures"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:underline"
            >
              Markets
            </a>
            <button
              onClick={fetchStocks}
              title="Refresh"
              className={`w-7 h-7 flex items-center justify-center rounded-md text-sm ${
                dark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'
              }`}
            >
              🔄
            </button>
          </div>

          {stocks.length === 0 ? (
            <div className="text-sm opacity-70">Loading...</div>
          ) : (
            <div className="space-y-2 text-sm">
              {stocks.map((s) => (
                <div key={s.name} className="flex justify-between items-center">
                  <span className="font-medium">{s.name}</span>
                  <div className="flex items-center">
                    <div className="text-right">
                      <div>{s.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                      <div className={s.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {s.change >= 0 ? '+' : ''}
                        {s.change.toFixed(2)} ({s.changePercent.toFixed(2)}%)
                      </div>
                    </div>
                    <Sparkline data={s.history} positive={s.change >= 0} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {stocksUpdatedAt && (
            <div className="mt-3 text-xs opacity-50">
              Updated {new Date(stocksUpdatedAt).toLocaleTimeString()}
            </div>
          )}
        </div>




        {/* Checkbook card */}
        <div className={`rounded-xl p-5 border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-center mb-2">
            <a
              href="/transactions"
              className="font-semibold hover:underline"
            >
              Checkbook
            </a>
            <button
              onClick={() => setShowBalance(!showBalance)}
              title={showBalance ? 'Hide balance' : 'Show balance'}
              className={`w-7 h-7 flex items-center justify-center rounded-md text-sm ${
                dark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'
              }`}
            >
              {showBalance ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>

          <div className="text-3xl font-bold mt-1">
            {checkbookBalance === null
              ? '...'
              : showBalance
              ? `$${checkbookBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '******'}
              {projection.length > 0 && <ProjectionChart data={projection} />}
          </div>
        </div>





                {/* Habits card */}
        <div className={`rounded-xl p-5 border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="font-semibold mb-3">Habits</div>

          {/* Add new habit */}
          <form onSubmit={addHabit} className="mb-4 flex gap-2">
            <input
              type="text"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="New habit..."
              className={`flex-1 px-3 py-1.5 rounded-md border text-sm ${
                dark
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <button
              type="submit"
              className={`px-3 py-1.5 rounded-md text-sm ${
                dark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'
              }`}
            >
              Add
            </button>
          </form>

          {/* Today's habits */}
          <div className="space-y-2">
            {habits.length === 0 ? (
              <div className="text-sm opacity-70">No habits yet</div>
            ) : (
              habits.map((habit) => {
                const done = todayCompletions.includes(habit.id);
                return (
                  <div key={habit.id} className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => toggleHabit(habit.id)}
                        className="rounded"
                      />
                      <span className={done ? 'line-through opacity-60' : ''}>{habit.name}</span>
                    </label>
                    <button
                      onClick={() => archiveHabit(habit.id)}
                      className="text-xs opacity-50 hover:opacity-100"
                      title="Archive habit"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-3 text-xs opacity-60">
            {todayCompletions.length} / {habits.length} done today
          </div>
        </div>

        {/* Other cards */}
        

        
      </div>
    </main>
  );
}