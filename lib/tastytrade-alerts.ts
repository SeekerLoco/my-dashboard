// Watch page alert rules: pure functions that check the newest tastytrade snapshot (no network, no Supabase).
// Tune the thresholds below; the Alerts panel and its "Rules" list read these same constants.
import type {
  TtAccount,
  TtBalance,
  TtPosition,
  TtTrade,
} from '@/lib/tastytrade';

// --- Thresholds (edit these) ---------------------------------------------

// Rule 1: warn when a short option's strike is within this % of the stock price (in the money = critical).
export const STRIKE_NEAR_PCT = 3;
// Rule 2: warn when total position delta is beyond +/- this many shares-equivalent (1 contract = 100 shares).
export const DELTA_LIMIT_SHARES = 30;
// Rule 3: "consider closing" once captured profit reaches this % of the trade's max profit.
export const PROFIT_TARGET_PCT = 50;
// Rule 4: warn at or under this many days to expiration; critical at or under the second number.
export const DTE_WARN_DAYS = 21;
export const DTE_CRITICAL_DAYS = 7;
// Rule 5: warn when option buying power is under this % of net liq; critical under the second number.
export const BP_WARN_PCT = 20;
export const BP_CRITICAL_PCT = 10;
// Stale-data note when the newest snapshot is older than this many hours.
export const STALE_HOURS = 24;

const OPTION_MULTIPLIER = 100;

// --- Types ---------------------------------------------------------------

export type AlertSeverity = 'info' | 'warn' | 'critical' | 'good';
export type AlertRule = 'strike' | 'delta' | 'profit' | 'dte' | 'bp' | 'stale';

export type Alert = {
  id: string;
  rule: AlertRule;
  severity: AlertSeverity;
  symbol: string;
  message: string;
  account: string; // last4
};

export type AlertResult = {
  alerts: Alert[];
  // Rules that could not be checked (e.g. no price for an underlying); shown muted.
  notes: string[];
};

export type AccountInput = {
  account: Pick<TtAccount, 'id' | 'account_last4'>;
  balance: Pick<TtBalance, 'as_of' | 'net_liq' | 'buying_power_derivative'>;
  positions: TtPosition[];
};

export type PriceMap = Record<string, number>;

// --- Small helpers -------------------------------------------------------

function toNum(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function usd(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: Math.abs(n) >= 1000 ? 0 : 2,
  });
}

function isOption(p: TtPosition): boolean {
  return (
    p.option_type !== null ||
    (p.instrument_type ?? '').toLowerCase().includes('option')
  );
}

function isShort(p: TtPosition): boolean {
  return (p.direction ?? '').toLowerCase().startsWith('short');
}

function isLong(p: TtPosition): boolean {
  return (p.direction ?? '').toLowerCase().startsWith('long');
}

// "EWZ   261120P00030000" -> "EWZ" when the underlying column is empty.
export function underlyingOf(p: TtPosition): string {
  return (p.underlying ?? p.symbol.split(/\s+/)[0] ?? '').toUpperCase();
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 0,
  warn: 1,
  good: 2,
  info: 3,
};

// Denver calendar date (YYYY-MM-DD) of an instant.
export function denverDate(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Denver' });
}

// Whole days from today (Denver) to a YYYY-MM-DD expiration; negative once expired.
export function daysToExpiration(expiration: string, now: Date): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(expiration);
  const t = /^(\d{4})-(\d{2})-(\d{2})$/.exec(denverDate(now));
  if (!m || !t) return null;
  const exp = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const today = Date.UTC(+t[1], +t[2] - 1, +t[3]);
  return Math.round((exp - today) / 86_400_000);
}

// Underlying tickers whose stock price rule 1 needs (short option legs only).
export function underlyingsNeedingPrice(accounts: AccountInput[]): string[] {
  const set = new Set<string>();
  for (const a of accounts)
    for (const p of a.positions)
      if (isOption(p) && isShort(p) && toNum(p.strike) !== null)
        set.add(underlyingOf(p));
  return [...set].filter(Boolean).sort();
}

// --- Rule 1: short strike near the stock price ---------------------------

export function shortStrikeAlerts(
  a: AccountInput,
  prices: PriceMap,
): AlertResult {
  const alerts: Alert[] = [];
  const notes: string[] = [];
  const missing = new Set<string>();
  for (const p of a.positions) {
    const strike = toNum(p.strike);
    if (!isOption(p) || !isShort(p) || strike === null || strike <= 0) continue;
    const und = underlyingOf(p);
    const price = prices[und];
    if (price === undefined || !(price > 0)) {
      missing.add(und);
      continue;
    }
    const kind = (p.option_type ?? '').toLowerCase();
    const itm = kind.startsWith('c') ? price > strike : price < strike;
    const pct = (Math.abs(price - strike) / strike) * 100;
    if (!itm && pct > STRIKE_NEAR_PCT) continue;
    alerts.push({
      id: `strike-${a.account.id}-${p.symbol}`,
      rule: 'strike',
      severity: itm ? 'critical' : 'warn',
      symbol: p.symbol,
      account: a.account.account_last4,
      message: itm
        ? `Short ${kind || 'option'} is in the money: ${und} is ${usd(price)}, strike ${strike} (${pct.toFixed(1)}% through).`
        : `Short ${kind || 'option'} strike ${strike} is ${pct.toFixed(1)}% from ${und} at ${usd(price)} (limit ${STRIKE_NEAR_PCT}%).`,
    });
  }
  for (const und of missing)
    notes.push(
      `No stock price for ${und}, so the short strike check was skipped.`,
    );
  return { alerts, notes };
}

// --- Rule 2: total delta limit -------------------------------------------

// Position delta in shares-equivalent: per-contract delta x quantity x 100, negated for short.
export function positionDeltaShares(p: TtPosition): number | null {
  const delta = toNum(p.delta);
  const qty = toNum(p.quantity);
  if (delta === null || qty === null) return null;
  if (!isShort(p) && !isLong(p)) return null;
  const sign = isShort(p) ? -1 : 1;
  const mult = isOption(p) ? OPTION_MULTIPLIER : 1;
  return delta * Math.abs(qty) * mult * sign;
}

export function totalDeltaShares(positions: TtPosition[]): {
  total: number;
  counted: number;
  skipped: number;
} {
  let total = 0;
  let counted = 0;
  let skipped = 0;
  for (const p of positions) {
    const d = positionDeltaShares(p);
    if (d === null) skipped++;
    else {
      total += d;
      counted++;
    }
  }
  return { total, counted, skipped };
}

export function deltaAlerts(a: AccountInput): AlertResult {
  const { total, counted, skipped } = totalDeltaShares(a.positions);
  const notes: string[] = [];
  if (skipped > 0 && counted > 0)
    notes.push(
      `Delta total skips ${skipped} position(s) with no delta saved yet.`,
    );
  if (counted === 0 && a.positions.length > 0)
    notes.push('No Greeks saved yet, so the delta check was skipped.');
  const alerts: Alert[] = [];
  if (counted > 0 && Math.abs(total) > DELTA_LIMIT_SHARES)
    alerts.push({
      id: `delta-${a.account.id}`,
      rule: 'delta',
      severity: 'warn',
      symbol: 'Total delta',
      account: a.account.account_last4,
      message: `Total delta is ${total >= 0 ? '+' : ''}${total.toFixed(1)} shares, beyond the ±${DELTA_LIMIT_SHARES} limit.`,
    });
  return { alerts, notes };
}

// --- Rule 3: 50% of max profit reached -----------------------------------

type MatchedLeg = { p: TtPosition; sign: 1 | -1 };

// Finds the open positions behind a trade. Uses the trade's legs when it has them
// (strike + option type + expiration), otherwise every open option on its underlying.
function matchTradePositions(
  t: TtTrade,
  positions: TtPosition[],
): MatchedLeg[] | null {
  const und = (t.underlying ?? '').toUpperCase();
  const mine = positions.filter((p) => isOption(p) && underlyingOf(p) === und);
  if (!und || mine.length === 0) return null;
  if (!t.legs?.length)
    return mine.map((p) => ({ p, sign: isShort(p) ? 1 : -1 }) as MatchedLeg);
  const out: MatchedLeg[] = [];
  for (const leg of t.legs) {
    const p = mine.find(
      (m) =>
        toNum(m.strike) === Number(leg.strike) &&
        (m.option_type ?? '').toLowerCase().startsWith(leg.option_type[0]) &&
        (m.expiration ?? '').slice(0, 10) === leg.expiration.slice(0, 10),
    );
    if (!p) return null; // a leg is missing, so the trade is no longer fully open
    out.push({ p, sign: leg.direction === 'sell' ? 1 : -1 });
  }
  return out;
}

export function profitTargetAlerts(
  a: AccountInput,
  trades: TtTrade[],
): AlertResult {
  const alerts: Alert[] = [];
  for (const t of trades) {
    if (t.status !== 'open') continue;
    if (t.account_id && t.account_id !== a.account.id) continue;
    const entry = toNum(t.entry_price);
    const contracts = toNum(t.contracts);
    const maxProfit = toNum(t.max_profit);
    if (entry === null || contracts === null || contracts <= 0) continue;
    if (maxProfit === null || maxProfit <= 0) continue;
    const legs = matchTradePositions(t, a.positions);
    if (!legs) continue;
    const marks = legs.map((l) => toNum(l.p.mark));
    if (marks.some((m) => m === null)) continue;
    // Cost per share to close the whole structure: pay for shorts, collect for longs.
    const closeCost = legs.reduce(
      (s, l, i) => s + l.sign * (marks[i] as number),
      0,
    );
    // Credit trade if max profit equals the credit received; otherwise guess from the sign of closeCost.
    const creditSignature =
      Math.abs(maxProfit - entry * OPTION_MULTIPLIER * contracts) <=
      maxProfit * 0.01;
    const isCredit = creditSignature || closeCost > 0;
    const perShare = isCredit ? entry - closeCost : -closeCost - entry;
    const captured = perShare * OPTION_MULTIPLIER * contracts;
    const pct = (captured / maxProfit) * 100;
    if (pct < PROFIT_TARGET_PCT) continue;
    alerts.push({
      id: `profit-${t.id}`,
      rule: 'profit',
      severity: 'good',
      symbol: `${t.underlying ?? ''} ${t.strategy ?? ''}`.trim(),
      account: a.account.account_last4,
      message: `Captured about ${usd(captured)} of ${usd(maxProfit)} max profit (${pct.toFixed(0)}%). Consider closing.`,
    });
  }
  return { alerts, notes: [] };
}

// --- Rule 4: days to expiration ------------------------------------------

export function dteAlerts(a: AccountInput, now: Date): AlertResult {
  const alerts: Alert[] = [];
  for (const p of a.positions) {
    if (!isOption(p) || !p.expiration) continue;
    const dte = daysToExpiration(p.expiration, now);
    if (dte === null || dte > DTE_WARN_DAYS) continue;
    const critical = dte <= DTE_CRITICAL_DAYS;
    alerts.push({
      id: `dte-${a.account.id}-${p.symbol}`,
      rule: 'dte',
      severity: critical ? 'critical' : 'warn',
      symbol: p.symbol,
      account: a.account.account_last4,
      message:
        dte < 0
          ? `Expiration ${p.expiration} has passed (${-dte} day${dte === -1 ? '' : 's'} ago).`
          : dte === 0
            ? `Expires today (${p.expiration}).`
            : `${dte} day${dte === 1 ? '' : 's'} to expiration (${p.expiration}).`,
    });
  }
  return { alerts, notes: [] };
}

// --- Rule 5: low option buying power -------------------------------------

export function buyingPowerAlerts(a: AccountInput): AlertResult {
  const bp = toNum(a.balance.buying_power_derivative);
  const nl = toNum(a.balance.net_liq);
  if (bp === null || nl === null || nl <= 0) return { alerts: [], notes: [] };
  const pct = (bp / nl) * 100;
  if (pct >= BP_WARN_PCT) return { alerts: [], notes: [] };
  return {
    alerts: [
      {
        id: `bp-${a.account.id}`,
        rule: 'bp',
        severity: pct < BP_CRITICAL_PCT ? 'critical' : 'warn',
        symbol: 'Option buying power',
        account: a.account.account_last4,
        message: `Option buying power is ${usd(bp)}, ${pct.toFixed(0)}% of net liq ${usd(nl)} (warns under ${BP_WARN_PCT}%).`,
      },
    ],
    notes: [],
  };
}

// --- Stale snapshot ------------------------------------------------------

export function staleAlerts(a: AccountInput, now: Date): AlertResult {
  const t = new Date(a.balance.as_of).getTime();
  if (!Number.isFinite(t)) return { alerts: [], notes: [] };
  const hours = (now.getTime() - t) / 3_600_000;
  if (hours <= STALE_HOURS) return { alerts: [], notes: [] };
  return {
    alerts: [
      {
        id: `stale-${a.account.id}`,
        rule: 'stale',
        severity: 'info',
        symbol: 'Snapshot',
        account: a.account.account_last4,
        message: `Data is ${hours >= 48 ? `${Math.floor(hours / 24)} days` : `${Math.floor(hours)} hours`} old, so these checks may be out of date. Ask TT bot for a fresh snapshot.`,
      },
    ],
    notes: [],
  };
}

// --- Everything ----------------------------------------------------------

export function evaluateAlerts(input: {
  accounts: AccountInput[];
  trades: TtTrade[] | null; // null when the journal could not be read
  prices: PriceMap;
  now: Date;
}): AlertResult {
  const alerts: Alert[] = [];
  const notes = new Set<string>();
  const add = (r: AlertResult) => {
    alerts.push(...r.alerts);
    r.notes.forEach((n) => notes.add(n));
  };
  for (const a of input.accounts) {
    add(staleAlerts(a, input.now));
    add(buyingPowerAlerts(a));
    add(shortStrikeAlerts(a, input.prices));
    add(deltaAlerts(a));
    if (input.trades) add(profitTargetAlerts(a, input.trades));
    add(dteAlerts(a, input.now));
  }
  if (!input.trades)
    notes.add(
      'Could not read the trade journal, so the profit target check was skipped.',
    );
  alerts.sort(
    (x, y) => SEVERITY_ORDER[x.severity] - SEVERITY_ORDER[y.severity],
  );
  return { alerts, notes: [...notes] };
}

// One line per rule for the collapsible "Rules" list, built from the constants above.
export const RULE_LINES: string[] = [
  `Short strike near price: warn within ${STRIKE_NEAR_PCT}% of the stock price, red if in the money.`,
  `Delta limit: warn when total delta is beyond ±${DELTA_LIMIT_SHARES} shares-equivalent (delta × quantity × 100).`,
  `Profit target: consider closing an open journal trade at ${PROFIT_TARGET_PCT}% of max profit.`,
  `Expiration: warn at ${DTE_WARN_DAYS} days or fewer, red at ${DTE_CRITICAL_DAYS} or fewer (Denver time).`,
  `Buying power: warn under ${BP_WARN_PCT}% of net liq, red under ${BP_CRITICAL_PCT}%.`,
  `Stale data: note when the newest snapshot is over ${STALE_HOURS} hours old.`,
];
