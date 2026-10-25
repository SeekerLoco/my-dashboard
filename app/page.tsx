// Main dashboard page: header and the grid of cards.
'use client';

import WeatherCard from '@/components/cards/WeatherCard';
import MarketsCard from '@/components/cards/MarketsCard';
import CheckbookCard from '@/components/cards/CheckbookCard';
import SdltCard from '@/components/cards/SdltCard';
import HabitsCard from '@/components/cards/HabitsCard';
import SoccerCard from '@/components/cards/SoccerCard';
import TelegraphCard from '@/components/cards/TelegraphCard';
import JournalCard from '@/components/cards/JournalCard';
import TastytradeCard from '@/components/cards/TastytradeCard';
import ZoeCard from '@/components/cards/ZoeCard';
import LogoutButton from '@/components/LogoutButton';

export default function Home() {
  return (
    <main className="min-h-screen p-6 text-white">
      <header className="panel fade-in mb-6 px-5 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Grid icon tile */}
          <span className="w-9 h-9 grid grid-cols-3 gap-0.5 p-2 rounded-xl bg-white/10 border border-white/10">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="rounded-full bg-white/80" />
            ))}
          </span>
          <h1 className="text-xl font-bold">SeekerLoco Hub</h1>
        </div>
        <LogoutButton />
      </header>

      {/* Masonry-ish grid: Weather and Markets span two rows; dense flow fills the gaps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 grid-flow-row-dense stagger">
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

        {/* Daily Telegraph card */}
        <TelegraphCard />

        {/* Journal card */}
        <JournalCard />

        {/* tastytrade card */}
        <TastytradeCard />

        {/* Hi Zoe card */}
        <ZoeCard />
      </div>
    </main>
  );
}
