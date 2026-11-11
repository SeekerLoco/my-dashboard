// Physical Therapy page: tracks the home exercise program (through Jan 15, 2027) by day and week,
// with per-exercise check-offs and a notes box for each day.
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getLocalDateString, parseLocalDate } from '@/lib/dates';
import PageHeader from '@/components/PageHeader';

// Program settings
const PROGRAM_START = '2026-11-11';
const PROGRAM_END = '2027-01-15';
// "Roughly every other day": a Monday-Sunday week meets the goal at 3 sessions, 4 is the stretch.
// Weeks are counted as a whole, so a skipped day made up the next day still counts.
const WEEKLY_TARGET = 3;
const WEEKLY_STRETCH = 4;

type Exercise = { id: string; name: string; details: string | null };
type Log = { day: string; exercise_id: string };
type DayStatus = 'full' | 'partial' | 'none' | 'future' | 'outside';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function addDays(dateStr: string, n: number) {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + n);
  return getLocalDateString(d);
}

// Monday of the week containing dateStr
function weekStart(dateStr: string) {
  const d = parseLocalDate(dateStr);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return getLocalDateString(d);
}

function daysBetween(a: string, b: string) {
  return Math.round(
    (parseLocalDate(b).getTime() - parseLocalDate(a).getTime()) / 86400000,
  );
}

const PROGRAM_DAYS = daysBetween(PROGRAM_START, PROGRAM_END) + 1;
const PROGRAM_TARGET = Math.ceil(PROGRAM_DAYS / 2);

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full bg-pink-400 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const STATUS_STYLE: Record<DayStatus, string> = {
  full: 'bg-pink-500/80 border-pink-300/60',
  partial: 'bg-pink-500/30 border-pink-400/40',
  none: 'bg-white/5 border-white/10',
  future: 'bg-transparent border-white/10 border-dashed',
  outside: 'bg-transparent border-transparent opacity-30',
};

export default function PhysicalTherapyPage() {
  const today = getLocalDateString();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState(
    today < PROGRAM_START
      ? PROGRAM_START
      : today > PROGRAM_END
        ? PROGRAM_END
        : today,
  );
  const [draft, setDraft] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>(
    'idle',
  );

  // Reads Supabase tables pt_exercises, pt_exercise_log and pt_days
  const load = useCallback(async () => {
    const [ex, lg, dy] = await Promise.all([
      supabase
        .from('pt_exercises')
        .select('id, name, details')
        .eq('active', true)
        .order('sort_order'),
      supabase.from('pt_exercise_log').select('day, exercise_id'),
      supabase.from('pt_days').select('day, notes'),
    ]);
    setExercises(ex.data || []);
    setLogs(lg.data || []);
    const map: Record<string, string> = {};
    (dy.data || []).forEach((d) => (map[d.day] = d.notes || ''));
    setNotes(map);
  }, []);

  useEffect(() => {
    load(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [load]);

  // Keep the notes box in sync with the selected day
  useEffect(() => {
    setDraft(notes[selected] || ''); // eslint-disable-line react-hooks/set-state-in-effect
    setSaveState('idle');
  }, [selected, notes]);

  const exerciseIds = new Set(exercises.map((e) => e.id));
  const doneByDay: Record<string, Set<string>> = {};
  logs.forEach((l) => {
    if (!exerciseIds.has(l.exercise_id)) return;
    (doneByDay[l.day] ||= new Set()).add(l.exercise_id);
  });

  function statusFor(day: string): DayStatus {
    if (day < PROGRAM_START || day > PROGRAM_END) return 'outside';
    const n = doneByDay[day]?.size || 0;
    if (exercises.length > 0 && n >= exercises.length) return 'full';
    if (n > 0) return 'partial';
    return day > today ? 'future' : 'none';
  }

  // A session is a day with every exercise checked off
  const sessionDays = Object.keys(doneByDay).filter(
    (d) => d >= PROGRAM_START && d <= PROGRAM_END && statusFor(d) === 'full',
  );
  const totalSessions = sessionDays.length;
  const totalChecks = Object.entries(doneByDay)
    .filter(([d]) => d >= PROGRAM_START && d <= PROGRAM_END)
    .reduce((sum, [, s]) => sum + s.size, 0);

  const selWeek = weekStart(selected);
  const weekDays = DAY_NAMES.map((_, i) => addDays(selWeek, i));
  const weekSessions = weekDays.filter((d) => statusFor(d) === 'full').length;
  const weekPartials = weekDays.filter(
    (d) => statusFor(d) === 'partial',
  ).length;

  // All program weeks for the overview grid
  const weeks: string[] = [];
  for (let w = weekStart(PROGRAM_START); w <= PROGRAM_END; w = addDays(w, 7)) {
    weeks.push(w);
  }
  const weeksElapsed = weeks.filter((w) => w <= today).length;

  // Per-exercise completion counts across the program
  const perExercise = exercises.map((e) => ({
    ...e,
    count: Object.entries(doneByDay).filter(
      ([d, s]) => d >= PROGRAM_START && d <= PROGRAM_END && s.has(e.id),
    ).length,
  }));

  // Writes Supabase table pt_exercise_log (insert or delete one check-off)
  async function toggle(exerciseId: string) {
    const done = doneByDay[selected]?.has(exerciseId);
    if (done) {
      setLogs((prev) =>
        prev.filter(
          (l) => !(l.day === selected && l.exercise_id === exerciseId),
        ),
      );
      await supabase
        .from('pt_exercise_log')
        .delete()
        .eq('day', selected)
        .eq('exercise_id', exerciseId);
    } else {
      setLogs((prev) => [...prev, { day: selected, exercise_id: exerciseId }]);
      await supabase
        .from('pt_exercise_log')
        .insert({ day: selected, exercise_id: exerciseId });
    }
    load();
  }

  // Marks every exercise done (or clears them all) for the selected day
  async function toggleAll() {
    const allDone = statusFor(selected) === 'full';
    if (allDone) {
      await supabase.from('pt_exercise_log').delete().eq('day', selected);
    } else {
      const missing = exercises
        .filter((e) => !doneByDay[selected]?.has(e.id))
        .map((e) => ({ day: selected, exercise_id: e.id }));
      if (missing.length)
        await supabase.from('pt_exercise_log').insert(missing);
    }
    load();
  }

  // Writes Supabase table pt_days (upsert the day's notes)
  async function saveNotes() {
    if ((notes[selected] || '') === draft) return;
    setSaveState('saving');
    await supabase.from('pt_days').upsert({
      day: selected,
      notes: draft,
      updated_at: new Date().toISOString(),
    });
    setNotes((prev) => ({ ...prev, [selected]: draft }));
    setSaveState('saved');
  }

  const selDate = parseLocalDate(selected);
  const selLabel = selDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const canPrev = addDays(selWeek, -1) >= weekStart(PROGRAM_START);
  const canNext = addDays(selWeek, 7) <= PROGRAM_END;

  return (
    <main className="min-h-screen text-white p-6 max-w-5xl mx-auto">
      <PageHeader title="Physical Therapy" icon="🦵" accent="pink" />

      {/* Progress summary */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="panel p-5">
          <div className="text-xs text-slate-400 mb-1">This week</div>
          <div className="text-3xl font-extrabold mb-2">
            {weekSessions}/{WEEKLY_TARGET}
            <span className="text-sm font-normal text-slate-400">
              {' '}
              sessions
            </span>
          </div>
          <ProgressBar value={weekSessions} max={WEEKLY_TARGET} />
          <div className="text-xs text-slate-400 mt-2">
            {weekSessions >= WEEKLY_STRETCH
              ? 'Stretch goal met ★'
              : weekSessions >= WEEKLY_TARGET
                ? `Weekly goal met · ${WEEKLY_STRETCH} is the stretch`
                : `${WEEKLY_TARGET - weekSessions} to go${weekPartials ? ` · ${weekPartials} partial day${weekPartials > 1 ? 's' : ''}` : ''}`}
          </div>
        </div>
        <div className="panel p-5">
          <div className="text-xs text-slate-400 mb-1">Whole program</div>
          <div className="text-3xl font-extrabold mb-2">
            {totalSessions}/{PROGRAM_TARGET}
            <span className="text-sm font-normal text-slate-400">
              {' '}
              sessions
            </span>
          </div>
          <ProgressBar value={totalSessions} max={PROGRAM_TARGET} />
          <div className="text-xs text-slate-400 mt-2">
            Week {Math.max(1, weeksElapsed)} of {weeks.length} · ends Jan 15
          </div>
        </div>
        <div className="panel p-5">
          <div className="text-xs text-slate-400 mb-1">Exercises completed</div>
          <div className="text-3xl font-extrabold mb-2">
            {totalChecks}
            <span className="text-sm font-normal text-slate-400">
              {' '}
              / {PROGRAM_TARGET * exercises.length}
            </span>
          </div>
          <ProgressBar
            value={totalChecks}
            max={PROGRAM_TARGET * exercises.length}
          />
          <div className="text-xs text-slate-400 mt-2">
            Individual check-offs toward the program goal
          </div>
        </div>
      </div>

      {/* Week strip */}
      <div className="panel p-5 mb-6">
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={() => setSelected(addDays(selWeek, -7))}
            disabled={!canPrev}
            className="px-2 text-blue-400 disabled:opacity-30"
          >
            ← Prev
          </button>
          <div className="font-semibold">
            Week of{' '}
            {parseLocalDate(selWeek).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </div>
          <button
            onClick={() => setSelected(addDays(selWeek, 7))}
            disabled={!canNext}
            className="px-2 text-blue-400 disabled:opacity-30"
          >
            Next →
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((d, i) => {
            const st = statusFor(d);
            const n = doneByDay[d]?.size || 0;
            return (
              <button
                key={d}
                onClick={() => st !== 'outside' && setSelected(d)}
                disabled={st === 'outside'}
                className={`rounded-lg border p-2 text-center text-xs transition ${STATUS_STYLE[st]} ${d === selected ? 'ring-2 ring-white/70' : ''}`}
              >
                <div className="opacity-70">{DAY_NAMES[i]}</div>
                <div className="text-base font-semibold">
                  {parseLocalDate(d).getDate()}
                </div>
                <div className="opacity-70">
                  {st === 'outside' ? '' : `${n}/${exercises.length}`}
                </div>
                {d === today && (
                  <div className="text-[10px] text-pink-200">today</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Selected day: checklist */}
        <div className="panel p-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">{selLabel}</h2>
            {exercises.length > 0 && (
              <button
                onClick={toggleAll}
                className="text-xs px-2 py-1 rounded-md bg-white/10 hover:bg-white/20"
              >
                {statusFor(selected) === 'full' ? 'Clear all' : 'Mark all done'}
              </button>
            )}
          </div>
          {exercises.length === 0 ? (
            <div className="text-sm opacity-70">No exercises set up yet</div>
          ) : (
            <div className="space-y-2">
              {exercises.map((e) => {
                const done = doneByDay[selected]?.has(e.id) || false;
                return (
                  <label
                    key={e.id}
                    className="flex items-start gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => toggle(e.id)}
                      className="mt-1 rounded"
                    />
                    <span>
                      <span className={done ? 'line-through opacity-60' : ''}>
                        {e.name}
                      </span>
                      {e.details && (
                        <span className="block text-xs text-slate-400">
                          {e.details}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected day: notes */}
        <div className="panel p-5 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Notes</h2>
            <span className="text-xs text-slate-400">
              {saveState === 'saving'
                ? 'Saving…'
                : saveState === 'saved'
                  ? 'Saved'
                  : ''}
            </span>
          </div>
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setSaveState('idle');
            }}
            onBlur={saveNotes}
            placeholder="How did it feel? Pain, stiffness, anything to tell your PT…"
            className="flex-1 min-h-40 w-full px-3 py-2 rounded-md border text-sm bg-white/5 border-white/10 text-white placeholder-slate-400"
          />
          <button
            onClick={saveNotes}
            className="mt-2 self-end px-3 py-1.5 rounded-md text-sm bg-indigo-500/70 hover:bg-indigo-500"
          >
            Save notes
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Program overview grid */}
        <div className="panel p-5">
          <h2 className="font-semibold mb-3">Program overview</h2>
          <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-1 text-[10px] items-center">
            <span />
            {DAY_NAMES.map((n) => (
              <span key={n} className="text-center opacity-60">
                {n[0]}
              </span>
            ))}
            {weeks.map((w) => {
              const days = DAY_NAMES.map((_, i) => addDays(w, i));
              const count = days.filter((d) => statusFor(d) === 'full').length;
              const met = count >= WEEKLY_TARGET;
              const stretch = count >= WEEKLY_STRETCH;
              return [
                <span
                  key={`${w}-label`}
                  className={`pr-2 whitespace-nowrap ${met ? 'text-pink-300' : 'opacity-60'}`}
                >
                  {parseLocalDate(w).toLocaleDateString(undefined, {
                    month: 'numeric',
                    day: 'numeric',
                  })}
                  {stretch ? ' ★' : met ? ' ✓' : ''}
                </span>,
                ...days.map((d) => (
                  <button
                    key={d}
                    title={d}
                    onClick={() => statusFor(d) !== 'outside' && setSelected(d)}
                    className={`h-5 rounded border ${STATUS_STYLE[statusFor(d)]} ${d === selected ? 'ring-1 ring-white' : ''}`}
                  />
                )),
              ];
            })}
          </div>
          <div className="flex gap-3 mt-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className={`w-3 h-3 rounded border ${STATUS_STYLE.full}`} />{' '}
              All done
            </span>
            <span className="flex items-center gap-1">
              <span
                className={`w-3 h-3 rounded border ${STATUS_STYLE.partial}`}
              />{' '}
              Partial
            </span>
            <span className="flex items-center gap-1">
              <span className={`w-3 h-3 rounded border ${STATUS_STYLE.none}`} />{' '}
              Rest / missed
            </span>
            <span className="text-pink-300">✓ goal (3) · ★ stretch (4)</span>
          </div>
        </div>

        {/* Per-exercise totals */}
        <div className="panel p-5">
          <h2 className="font-semibold mb-3">By exercise</h2>
          {perExercise.length === 0 ? (
            <div className="text-sm opacity-70">No exercises set up yet</div>
          ) : (
            <div className="space-y-3 text-sm">
              {perExercise.map((e) => (
                <div key={e.id}>
                  <div className="flex justify-between mb-1">
                    <span>{e.name}</span>
                    <span className="text-slate-400">
                      {e.count}/{PROGRAM_TARGET}
                    </span>
                  </div>
                  <ProgressBar value={e.count} max={PROGRAM_TARGET} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
