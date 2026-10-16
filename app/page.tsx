// Main dashboard page: header and the grid of cards.
'use client';

import WeatherCard from '@/components/cards/WeatherCard';
import MarketsCard from '@/components/cards/MarketsCard';
import CheckbookCard from '@/components/cards/CheckbookCard';
import SdltCard from '@/components/cards/SdltCard';
import HabitsCard from '@/components/cards/HabitsCard';
import SoccerCard from '@/components/cards/SoccerCard';

export default function Home() {
  return (
    <main className="min-h-screen p-6 text-white">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">SeekerLoco Hub</h1>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Weather card */}
        <WeatherCard />

        {/* Stocks card */}
        <MarketsCard />

        {/* Checkbook card */}
        <CheckbookCard />

        {/* SDLT card */}
        <SdltCard />

        {/* Habits card */}
        <HabitsCard />

        {/* Soccer card */}
        <SoccerCard />
      </div>
    </main>
  );
}
