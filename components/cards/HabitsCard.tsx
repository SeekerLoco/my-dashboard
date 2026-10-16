// Habits card: add, check off, and archive daily habits.
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dates';
import Card from '@/components/Card';

type Habit = { id: string; name: string };

export default function HabitsCard({ dark }: { dark: boolean }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayCompletions, setTodayCompletions] = useState<string[]>([]);
  const [newHabitName, setNewHabitName] = useState('');

  // Reads Supabase tables habits (active habits) and habits_completions (today's check-offs)
  async function loadHabits() {
    const { data: habitsData } = await supabase
      .from('habits')
      .select('id, name')
      .eq('active', true)
      .order('created_at');
    setHabits(habitsData || []);

    const today = getLocalDateString();
    const { data: completionsData } = await supabase
      .from('habits_completions')
      .select('habit_id')
      .eq('completed_date', today);

    setTodayCompletions(completionsData?.map((c) => c.habit_id) || []);
  }

  useEffect(() => {
    loadHabits();
  }, []);

  // Writes Supabase table habits_completions (insert or delete today's completion)
  async function toggleHabit(habitId: string) {
    const today = getLocalDateString();
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

  // Writes Supabase table habits (new habit)
  async function addHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    await supabase.from('habits').insert({ name: newHabitName.trim() });
    setNewHabitName('');
    loadHabits();
  }

  // Writes Supabase table habits (sets active = false)
  async function archiveHabit(habitId: string) {
    await supabase.from('habits').update({ active: false }).eq('id', habitId);
    loadHabits();
  }

  return (
    <Card dark={dark}>
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
            dark
              ? 'bg-slate-700 hover:bg-slate-600'
              : 'bg-slate-200 hover:bg-slate-300'
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
              <div
                key={habit.id}
                className="flex items-center justify-between gap-2"
              >
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => toggleHabit(habit.id)}
                    className="rounded"
                  />
                  <span className={done ? 'line-through opacity-60' : ''}>
                    {habit.name}
                  </span>
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
    </Card>
  );
}
