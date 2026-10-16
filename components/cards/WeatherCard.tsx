// Weather card: current conditions and 3-day forecast from Open-Meteo, with city search.
'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import CardTitle from '@/components/CardTitle';
import StatusPill from '@/components/StatusPill';
import { getWeatherInfo } from '@/lib/weather';
import { useCountUp } from '@/lib/useCountUp';

const DEFAULT_LAT = 39.55;
const DEFAULT_LON = -104.97;
const DEFAULT_NAME = 'Highlands Ranch';

type ForecastDay = {
  day: string;
  high: number;
  low: number;
  icon: string;
  label: string;
};

type WeatherData = {
  temp: number;
  description: string;
  icon: string;
  high: number;
  low: number;
  forecast: ForecastDay[];
};

export default function WeatherCard() {
  const [locationName, setLocationName] = useState(DEFAULT_NAME);
  const [searchInput, setSearchInput] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  // Count-up animation for the headline temperature
  const animatedTemp = useCountUp(weather?.temp ?? null);

  // Reads the Open-Meteo forecast API (api.open-meteo.com)
  async function fetchWeather(lat: number, lon: number, name: string) {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=fahrenheit&timezone=auto&forecast_days=4`,
    );
    const data = await res.json();

    const currentInfo = getWeatherInfo(data.current.weather_code);
    const days = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.'];
    const forecast = data.daily.time
      .slice(1, 4)
      .map((dateStr: string, i: number) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d); // local date, no UTC shift
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

  // Reads the Open-Meteo geocoding API to look up a city, then loads its weather
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchInput.trim()) return;

    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchInput)}&count=1&language=en&format=json`,
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

  return (
    <Card accent="blue" className="sm:row-span-2">
      <div className="mb-3 flex justify-between items-center">
        <CardTitle icon="⛅" accent="blue">
          <div className="font-semibold">Weather</div>
        </CardTitle>
        <StatusPill label="Now" accent="blue" />
      </div>
      <form onSubmit={handleSearch} className="mb-3 flex items-center gap-1.5">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search city..."
          className="flex-1 min-w-0 px-3 py-1.5 rounded-md border text-sm bg-white/5 border-white/10 text-white placeholder-slate-400"
        />
        <button
          type="submit"
          title="Search"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-sm bg-white/10 hover:bg-white/20 border border-white/10"
        >
          🔍
        </button>
        <button
          type="button"
          onClick={goHome}
          title="Reset to Highlands Ranch"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-sm bg-white/10 hover:bg-white/20 border border-white/10"
        >
          🏠
        </button>
      </form>

      <div className="text-sm text-slate-400">{locationName}</div>

      {weather ? (
        <>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-5xl">{weather.icon}</span>
            <div>
              <div className="text-5xl font-extrabold tracking-tight">
                {Math.round(animatedTemp ?? weather.temp)}°
              </div>
              <div className="text-sm text-slate-400">
                {weather.description}
              </div>
            </div>
          </div>

          <div className="text-sm mt-3 text-slate-300">
            H: <span className="text-red-400">{weather.high}°</span> &nbsp; L:{' '}
            <span className="text-blue-400">{weather.low}°</span>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            {weather.forecast.map((day) => (
              <div key={day.day} className="flex items-center justify-between">
                <span className="w-10">{day.day}</span>
                <span className="text-lg">{day.icon}</span>
                <span className="flex-1 text-right">
                  <span className="text-red-400">{day.high}°</span> /{' '}
                  <span className="text-blue-400">{day.low}°</span>
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-2">Loading...</div>
      )}
    </Card>
  );
}
