'use client';

import { useState, useEffect } from 'react';

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
          {/* Compact search row */}
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

        {/* Other cards */}
        <div className={`rounded-xl p-5 border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="font-semibold">S&P 500</div>
          <div className="text-2xl mt-1">7,805</div>
          <div className={`text-sm ${dark ? 'text-red-400' : 'text-red-600'}`}>-6.09</div>
        </div>

        <div className={`rounded-xl p-5 border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="font-semibold">Food diary</div>
          <div className="text-2xl mt-1">1,352</div>
          <div className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>kcal today</div>
        </div>

        <div className={`rounded-xl p-5 border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="font-semibold">Habits</div>
          <div className="text-2xl mt-1">0/5</div>
          <div className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>not logged yet</div>
        </div>
      </div>
    </main>
  );
}