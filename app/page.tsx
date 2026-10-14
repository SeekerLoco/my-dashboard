'use client';

import { useState, useEffect } from 'react';

// Helper: turn a weather code into a label + emoji
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

export default function Home() {
  const [dark, setDark] = useState(true);
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
    if (saved !== null) {
      setDark(saved === 'dark');
    }
  }, []);

  useEffect(() => {
    async function fetchWeather() {
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=39.55&longitude=-104.97&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=fahrenheit&timezone=America/Denver&forecast_days=4'
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
    }

    fetchWeather();
  }, []);

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
          <div className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Highlands Ranch</div>

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

        {/* Other cards unchanged */}
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