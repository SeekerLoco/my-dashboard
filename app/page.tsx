export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">SeekerLoco Hub</h1>
        <div className="text-sm opacity-70">Personal Dashboard</div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Weather card */}
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
          <div className="text-sm text-slate-400">Cary</div>
          <div className="text-4xl font-bold mt-1">72°</div>
          <div className="text-sm mt-2">Clear</div>
        </div>

        {/* Stocks card */}
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
          <div className="font-semibold">S&P 500</div>
          <div className="text-2xl mt-1">7,805</div>
          <div className="text-red-400 text-sm">-6.09</div>
        </div>

        {/* Food diary card */}
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
          <div className="font-semibold">Food diary</div>
          <div className="text-2xl mt-1">1,352</div>
          <div className="text-sm text-slate-400">kcal today</div>
        </div>

        {/* Habits card */}
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
          <div className="font-semibold">Habits</div>
          <div className="text-2xl mt-1">0/5</div>
          <div className="text-sm text-slate-400">not logged yet</div>
        </div>
      </div>
    </main>
  );
}
