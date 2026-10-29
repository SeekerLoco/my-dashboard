// Watch page "Trade journal": trades from tt_trades (newest first), a manual add form, and editing of thesis and lesson.
'use client';

import { useState } from 'react';
import { Section } from '@/components/tastytrade/TT';
import Field from '@/components/Field';
import {
  useTradeJournal,
  money,
  dateDenver,
  asOfDenver,
  denverLocalToIso,
  type TtAccountData,
  type TtLeg,
  type TtPosition,
  type TtState,
  type TtTrade,
  type TtTradeInput,
  type TtTradeStatus,
} from '@/lib/tastytrade';

const INPUT = 'w-full bg-white/5 border border-white/10 rounded px-3 py-2';
const BTN =
  'px-3 py-1.5 bg-indigo-500/70 hover:bg-indigo-500 rounded disabled:opacity-50';
const BTN_GHOST =
  'px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded border border-white/10';

const STATUS_CLS: Record<TtTradeStatus, string> = {
  open: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
  closed: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  expired: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
  rolled: 'bg-violet-500/15 text-violet-300 border-violet-400/30',
  assigned: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
};

function num(v: string): number | null {
  if (v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function txt(v: string): string | null {
  const t = v.trim();
  return t ? t : null;
}

function pnlClass(v: number | string | null): string {
  const n = Number(v);
  if (v === null || !Number.isFinite(n) || n === 0) return '';
  return n > 0 ? 'text-emerald-300' : 'text-red-300';
}

// Live P&L for an open trade from the latest hourly snapshot marks (mid prices).
// Each leg is matched to a snapshot position by account, expiration, strike and type;
// P&L = sum over legs of (mark − open price) for longs and (open − mark) for shorts, × qty × 100.
type LivePnl = { pnl: number; pctMax: number | null; asOf: string | null };

function livePnl(trade: TtTrade, accounts: TtAccountData[]): LivePnl | null {
  if (trade.status !== 'open' || !trade.legs?.length) return null;
  const acct = accounts.find((a) => a.account.id === trade.account_id);
  const pool: TtPosition[] = acct
    ? acct.positions
    : accounts.flatMap((a) => a.positions);
  let pnl = 0;
  for (const l of trade.legs) {
    const p = pool.find(
      (x) =>
        (x.underlying ?? '').toUpperCase() ===
          (trade.underlying ?? '').toUpperCase() &&
        x.expiration === l.expiration &&
        Number(x.strike) === Number(l.strike) &&
        (x.option_type ?? '').toLowerCase() === l.option_type,
    );
    if (!p || p.mark === null || p.avg_open_price === null) return null;
    const diff = Number(p.mark) - Number(p.avg_open_price);
    pnl += (l.direction === 'sell' ? -diff : diff) * Number(l.quantity) * 100;
  }
  pnl = Math.round(pnl * 100) / 100;
  const max = Number(trade.max_profit);
  return {
    pnl,
    pctMax:
      trade.max_profit !== null && max > 0
        ? Math.round((pnl / max) * 1000) / 10
        : null,
    asOf: acct?.balance.as_of ?? null,
  };
}

function legLabel(l: TtLeg): string {
  const sign = l.direction === 'sell' ? '-' : '+';
  const type = l.option_type === 'call' ? 'C' : 'P';
  return `${sign}${l.quantity} ${l.strike}${type} ${l.expiration}`;
}

type LegForm = {
  direction: 'buy' | 'sell';
  quantity: string;
  option_type: 'put' | 'call';
  strike: string;
  expiration: string;
};

const EMPTY_LEG: LegForm = {
  direction: 'sell',
  quantity: '1',
  option_type: 'put',
  strike: '',
  expiration: '',
};

type FormState = {
  accountId: string;
  underlying: string;
  strategy: string;
  status: TtTradeStatus;
  openedAt: string;
  closedAt: string;
  contracts: string;
  entryPrice: string;
  maxLoss: string;
  maxProfit: string;
  exitPrice: string;
  fees: string;
  realizedPnl: string;
  thesis: string;
  lesson: string;
  legs: LegForm[];
};

const EMPTY_FORM: FormState = {
  accountId: '',
  underlying: '',
  strategy: '',
  status: 'open',
  openedAt: '',
  closedAt: '',
  contracts: '',
  entryPrice: '',
  maxLoss: '',
  maxProfit: '',
  exitPrice: '',
  fees: '',
  realizedPnl: '',
  thesis: '',
  lesson: '',
  legs: [],
};

function AddTradeForm({
  accounts,
  onAdd,
  onDone,
}: {
  accounts: TtAccountData[];
  onAdd: (t: TtTradeInput) => Promise<string | null>;
  onDone: () => void;
}) {
  const [f, setF] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setF((p) => ({ ...p, [k]: v }));
  const setLeg = (i: number, patch: Partial<LegForm>) =>
    setF((p) => ({
      ...p,
      legs: p.legs.map((l, j) => (j === i ? { ...l, ...patch } : l)),
    }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const openedAt = f.openedAt ? denverLocalToIso(f.openedAt) : null;
    const closedAt = f.closedAt ? denverLocalToIso(f.closedAt) : null;
    if (!f.underlying.trim()) return setErr('Underlying is required.');
    if (!openedAt) return setErr('Opened date and time is required.');
    const legs: TtLeg[] = [];
    for (const l of f.legs) {
      const quantity = num(l.quantity);
      const strike = num(l.strike);
      if (quantity === null || strike === null || !l.expiration)
        return setErr('Each leg needs a quantity, strike and expiration.');
      legs.push({
        direction: l.direction,
        quantity,
        option_type: l.option_type,
        strike,
        expiration: l.expiration,
      });
    }
    setSaving(true);
    const msg = await onAdd({
      account_id: f.accountId || null,
      opened_at: openedAt,
      closed_at: closedAt,
      status: f.status,
      underlying: f.underlying.trim().toUpperCase(),
      strategy: txt(f.strategy),
      legs: legs.length ? legs : null,
      contracts:
        num(f.contracts) === null ? null : Math.round(num(f.contracts)!),
      entry_price: num(f.entryPrice),
      max_loss: num(f.maxLoss),
      max_profit: num(f.maxProfit),
      exit_price: num(f.exitPrice),
      fees: num(f.fees),
      realized_pnl: num(f.realizedPnl),
      thesis: txt(f.thesis),
      lesson: txt(f.lesson),
    });
    setSaving(false);
    if (msg) setErr(msg);
    else {
      setF(EMPTY_FORM);
      onDone();
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl bg-white/5 p-3 space-y-3 mb-4 text-sm"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="Underlying *">
          <input
            className={INPUT}
            value={f.underlying}
            onChange={(e) => set('underlying', e.target.value)}
            placeholder="EWZ"
          />
        </Field>
        <Field label="Strategy">
          <input
            className={INPUT}
            value={f.strategy}
            onChange={(e) => set('strategy', e.target.value)}
            placeholder="Put credit spread"
          />
        </Field>
        <Field label="Status">
          <select
            className={INPUT}
            value={f.status}
            onChange={(e) => set('status', e.target.value as TtTradeStatus)}
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="expired">Expired</option>
            <option value="rolled">Rolled</option>
            <option value="assigned">Assigned</option>
          </select>
        </Field>
        <Field label="Account">
          <select
            className={INPUT}
            value={f.accountId}
            onChange={(e) => set('accountId', e.target.value)}
          >
            <option value="">—</option>
            {accounts.map((a) => (
              <option key={a.account.id} value={a.account.id}>
                …{a.account.account_last4}
                {a.account.environment ? ` (${a.account.environment})` : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Opened (MT) *">
          <input
            type="datetime-local"
            className={INPUT}
            value={f.openedAt}
            onChange={(e) => set('openedAt', e.target.value)}
          />
        </Field>
        <Field label="Closed (MT)">
          <input
            type="datetime-local"
            className={INPUT}
            value={f.closedAt}
            onChange={(e) => set('closedAt', e.target.value)}
          />
        </Field>
        <Field label="Contracts">
          <input
            type="number"
            step="1"
            className={INPUT}
            value={f.contracts}
            onChange={(e) => set('contracts', e.target.value)}
          />
        </Field>
        <Field label="Entry price (per share)">
          <input
            type="number"
            step="0.01"
            className={INPUT}
            value={f.entryPrice}
            onChange={(e) => set('entryPrice', e.target.value)}
          />
        </Field>
        <Field label="Max loss ($)">
          <input
            type="number"
            step="0.01"
            className={INPUT}
            value={f.maxLoss}
            onChange={(e) => set('maxLoss', e.target.value)}
          />
        </Field>
        <Field label="Max profit ($)">
          <input
            type="number"
            step="0.01"
            className={INPUT}
            value={f.maxProfit}
            onChange={(e) => set('maxProfit', e.target.value)}
          />
        </Field>
        <Field label="Exit price (per share)">
          <input
            type="number"
            step="0.01"
            className={INPUT}
            value={f.exitPrice}
            onChange={(e) => set('exitPrice', e.target.value)}
          />
        </Field>
        <Field label="Fees ($)">
          <input
            type="number"
            step="0.01"
            className={INPUT}
            value={f.fees}
            onChange={(e) => set('fees', e.target.value)}
          />
        </Field>
        <Field label="Realized P&L ($)">
          <input
            type="number"
            step="0.01"
            className={INPUT}
            value={f.realizedPnl}
            onChange={(e) => set('realizedPnl', e.target.value)}
          />
        </Field>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm">Legs</span>
          <button
            type="button"
            className={BTN_GHOST}
            onClick={() =>
              setF((p) => ({ ...p, legs: [...p.legs, { ...EMPTY_LEG }] }))
            }
          >
            + Add leg
          </button>
        </div>
        {f.legs.map((l, i) => (
          <div key={i} className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-2">
            <select
              className={INPUT}
              value={l.direction}
              onChange={(e) =>
                setLeg(i, { direction: e.target.value as LegForm['direction'] })
              }
            >
              <option value="sell">Sell</option>
              <option value="buy">Buy</option>
            </select>
            <input
              type="number"
              step="1"
              className={INPUT}
              value={l.quantity}
              onChange={(e) => setLeg(i, { quantity: e.target.value })}
              placeholder="Qty"
            />
            <select
              className={INPUT}
              value={l.option_type}
              onChange={(e) =>
                setLeg(i, {
                  option_type: e.target.value as LegForm['option_type'],
                })
              }
            >
              <option value="put">Put</option>
              <option value="call">Call</option>
            </select>
            <input
              type="number"
              step="0.01"
              className={INPUT}
              value={l.strike}
              onChange={(e) => setLeg(i, { strike: e.target.value })}
              placeholder="Strike"
            />
            <input
              type="date"
              className={INPUT}
              value={l.expiration}
              onChange={(e) => setLeg(i, { expiration: e.target.value })}
            />
            <button
              type="button"
              className={BTN_GHOST}
              onClick={() =>
                setF((p) => ({ ...p, legs: p.legs.filter((_, j) => j !== i) }))
              }
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Thesis (why you took it)">
          <textarea
            rows={3}
            className={INPUT}
            value={f.thesis}
            onChange={(e) => set('thesis', e.target.value)}
          />
        </Field>
        <Field label="Lesson (what you learned)">
          <textarea
            rows={3}
            className={INPUT}
            value={f.lesson}
            onChange={(e) => set('lesson', e.target.value)}
          />
        </Field>
      </div>

      {err && <p className="text-red-300">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className={BTN}>
          {saving ? 'Saving…' : 'Save trade'}
        </button>
        <button type="button" onClick={onDone} className={BTN_GHOST}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function TradeRow({
  trade,
  live,
  onSave,
}: {
  trade: TtTrade;
  live: LivePnl | null;
  onSave: (
    id: string,
    n: { thesis: string | null; lesson: string | null },
  ) => Promise<string | null>;
}) {
  const [editing, setEditing] = useState(false);
  const [thesis, setThesis] = useState(trade.thesis ?? '');
  const [lesson, setLesson] = useState(trade.lesson ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setErr(null);
    const msg = await onSave(trade.id, {
      thesis: txt(thesis),
      lesson: txt(lesson),
    });
    setSaving(false);
    if (msg) setErr(msg);
    else setEditing(false);
  }

  const stat = (label: string, value: string, cls = '') => (
    <div>
      <div className="text-white/60 text-xs">{label}</div>
      <div className={`font-semibold ${cls}`}>{value}</div>
    </div>
  );

  return (
    <li className="rounded-xl bg-white/5 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-base">
          {trade.underlying ?? '—'}
        </span>
        <span className="text-white/70">{trade.strategy ?? '—'}</span>
        <span
          className={`px-2.5 py-0.5 rounded-full border text-xs font-medium capitalize ${STATUS_CLS[trade.status] ?? ''}`}
        >
          {trade.status}
        </span>
        <span className="ml-auto text-xs text-white/60">
          Opened {dateDenver(trade.opened_at)} · Closed{' '}
          {dateDenver(trade.closed_at)} MT
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
        {stat(
          'Contracts',
          trade.contracts === null ? '—' : String(trade.contracts),
        )}
        {stat('Entry price', money(trade.entry_price))}
        {stat('Max loss', money(trade.max_loss))}
        {stat(
          'Realized P&L',
          money(trade.realized_pnl),
          pnlClass(trade.realized_pnl),
        )}
        {trade.status === 'open' && (
          <>
            {stat(
              'Current P&L',
              live ? money(live.pnl) : '—',
              live ? pnlClass(live.pnl) : '',
            )}
            {stat(
              '% of max profit',
              live?.pctMax != null ? `${live.pctMax}%` : '—',
              live ? pnlClass(live.pnl) : '',
            )}
            {stat('Max profit', money(trade.max_profit))}
            <div className="text-white/50 text-xs self-end">
              {live
                ? `Mid marks as of ${live.asOf ? asOfDenver(live.asOf) : '—'}`
                : 'No matching snapshot legs'}
            </div>
          </>
        )}
      </div>
      {trade.legs?.length ? (
        <p className="text-xs text-white/60 mt-2">
          Legs: {trade.legs.map(legLabel).join(' · ')}
        </p>
      ) : null}
      {editing ? (
        <div className="mt-3 space-y-2">
          <Field label="Thesis">
            <textarea
              rows={3}
              className={INPUT}
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
            />
          </Field>
          <Field label="Lesson">
            <textarea
              rows={3}
              className={INPUT}
              value={lesson}
              onChange={(e) => setLesson(e.target.value)}
            />
          </Field>
          {err && <p className="text-red-300">{err}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className={BTN}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              className={BTN_GHOST}
              onClick={() => {
                setThesis(trade.thesis ?? '');
                setLesson(trade.lesson ?? '');
                setErr(null);
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid md:grid-cols-2 gap-3">
          <div>
            <div className="text-white/60 text-xs">Thesis</div>
            <p className="whitespace-pre-wrap">{trade.thesis ?? '—'}</p>
          </div>
          <div>
            <div className="text-white/60 text-xs">Lesson</div>
            <p className="whitespace-pre-wrap">{trade.lesson ?? '—'}</p>
          </div>
          <div className="md:col-span-2">
            <button
              type="button"
              className={BTN_GHOST}
              onClick={() => setEditing(true)}
            >
              Edit thesis &amp; lesson
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function TradeJournal({ tt }: { tt: TtState }) {
  const { state, addTrade, updateNotes } = useTradeJournal();
  const [adding, setAdding] = useState(false);
  const accounts = tt.status === 'live' ? tt.accounts : [];

  return (
    <Section
      title="Trade journal"
      accent="orange"
      className="lg:col-span-2"
      example={false}
    >
      {!adding && (
        <div className="mb-3">
          <button type="button" className={BTN} onClick={() => setAdding(true)}>
            + Add trade
          </button>
        </div>
      )}
      {adding && (
        <AddTradeForm
          accounts={accounts}
          onAdd={addTrade}
          onDone={() => setAdding(false)}
        />
      )}
      {state.status === 'loading' ? (
        <p className="text-sm text-white/60">Loading…</p>
      ) : state.status === 'error' ? (
        <p className="text-sm text-red-300">
          Couldn’t load trades: {state.message}
        </p>
      ) : state.trades.length === 0 ? (
        <p className="text-sm text-white/60">No trades yet</p>
      ) : (
        <ul className="space-y-3">
          {state.trades.map((t) => (
            <TradeRow
              key={t.id}
              trade={t}
              live={livePnl(t, accounts)}
              onSave={updateNotes}
            />
          ))}
        </ul>
      )}
    </Section>
  );
}
