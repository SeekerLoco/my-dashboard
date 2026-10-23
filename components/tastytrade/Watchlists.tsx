// Research "Watchlists" card: Johnny's symbol lists, kept in Supabase (tt_watchlists) and editable here.
'use client';

import { useState } from 'react';
import { Section } from '@/components/tastytrade/TT';
import { useWatchlists } from '@/lib/tastytrade-research';

export default function Watchlists() {
  const { state, addSymbol, removeSymbol } = useWatchlists();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [newList, setNewList] = useState('');
  const [newSym, setNewSym] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const add = async (list: string, sym: string, after: () => void) => {
    const e = await addSymbol(list, sym);
    setErr(e);
    if (!e) after();
  };
  const inputCls =
    'rounded-lg bg-white/10 px-2 py-1 text-sm outline-none focus:bg-white/15 min-w-0';

  return (
    <Section title="Watchlists" accent="violet" example={false}>
      {state.status === 'loading' && (
        <p className="text-sm text-white/60">Loading…</p>
      )}
      {state.status === 'error' && (
        <p className="text-sm text-red-300">Could not load: {state.message}</p>
      )}
      {state.status === 'ready' && (
        <div className="space-y-3">
          {state.lists.length === 0 && (
            <p className="text-sm text-white/60">
              No watchlists yet. Add a first symbol below.
            </p>
          )}
          {state.lists.map((l) => (
            <div key={l.name}>
              <p className="text-sm font-medium">{l.name}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {l.items.map((i) => (
                  <span
                    key={i.id}
                    className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-white/10 text-xs"
                  >
                    {i.symbol}
                    <button
                      type="button"
                      aria-label={`Remove ${i.symbol} from ${l.name}`}
                      className="px-1 text-white/50 hover:text-red-300"
                      onClick={async () => setErr(await removeSymbol(i.id))}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <form
                  className="inline-flex gap-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    add(l.name, draft[l.name] ?? '', () =>
                      setDraft((d) => ({ ...d, [l.name]: '' })),
                    );
                  }}
                >
                  <input
                    className={`${inputCls} w-20`}
                    placeholder="Add…"
                    value={draft[l.name] ?? ''}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, [l.name]: e.target.value }))
                    }
                  />
                </form>
              </div>
            </div>
          ))}
          <form
            className="flex flex-wrap gap-1.5 pt-2 border-t border-white/10"
            onSubmit={(e) => {
              e.preventDefault();
              add(newList, newSym, () => {
                setNewList('');
                setNewSym('');
              });
            }}
          >
            <input
              className={`${inputCls} flex-1 basis-28`}
              placeholder="New list name"
              value={newList}
              onChange={(e) => setNewList(e.target.value)}
            />
            <input
              className={`${inputCls} w-24`}
              placeholder="Symbol"
              value={newSym}
              onChange={(e) => setNewSym(e.target.value)}
            />
            <button
              type="submit"
              className="rounded-lg bg-violet-500/30 hover:bg-violet-500/45 px-3 py-1 text-sm"
            >
              Add
            </button>
          </form>
          {err && <p className="text-xs text-red-300">{err}</p>}
          <p className="text-xs text-white/50">
            TT bot reads these lists to decide what to screen.
          </p>
        </div>
      )}
    </Section>
  );
}
