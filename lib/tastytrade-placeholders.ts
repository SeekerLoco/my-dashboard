// tastytrade placeholder data: every value here is EXAMPLE data for layout only. Replace with real API data later.
import type { Accent } from '@/components/Card';

export type AccountKind = 'Live' | 'Sandbox';

export const TT_STEPS: {
  n: number;
  slug: string;
  title: string;
  blurb: string;
  icon: string;
  accent: Accent;
  account: AccountKind;
  enabled: boolean;
}[] = [
  {
    n: 1,
    slug: 'watch',
    title: 'Watch',
    blurb:
      'Portfolio monitoring, read-only: positions, balances, Greeks, alerts.',
    icon: '👀',
    accent: 'blue',
    account: 'Live',
    enabled: true,
  },
  {
    n: 2,
    slug: 'research',
    title: 'Research',
    blurb: 'Screener, option chains, watchlists, and backtests.',
    icon: '🔬',
    accent: 'teal',
    account: 'Live',
    enabled: true,
  },
  {
    n: 3,
    slug: 'sandbox',
    title: 'Sandbox',
    blurb: 'Practice multi-leg orders with fake money.',
    icon: '🧪',
    accent: 'violet',
    account: 'Sandbox',
    enabled: true,
  },
  {
    n: 4,
    slug: 'staging',
    title: 'Order Staging',
    blurb: 'Proposed trades with dry-run impact; you approve or reject.',
    icon: '📋',
    accent: 'orange',
    account: 'Live',
    enabled: false,
  },
  {
    n: 5,
    slug: 'automation',
    title: 'Automation',
    blurb: 'Rules, risk limits, kill switch, and activity log.',
    icon: '🤖',
    accent: 'pink',
    account: 'Live',
    enabled: false,
  },
];

export const cardTiles = [
  { label: 'Net Liq', value: '—' },
  { label: 'Buying Power', value: '—' },
  { label: 'Day P&L', value: '—' },
  { label: 'Portfolio Δ', value: '—' },
  { label: 'Portfolio Θ', value: '—' },
];

export const balances = [
  { label: 'Net Liquidating Value', value: '$25,000.00' },
  { label: 'Option Buying Power', value: '$12,400.00' },
  { label: 'Cash Balance', value: '$8,150.00' },
  { label: 'Maintenance Requirement', value: '$4,300.00' },
];

export const positions = [
  { symbol: 'SPY', type: 'Iron Condor', qty: 1, dte: 32, pl: '+$84.00' },
  { symbol: 'AAPL', type: 'Put Credit Spread', qty: 2, dte: 18, pl: '-$22.00' },
  { symbol: 'IWM', type: 'Short Strangle', qty: 1, dte: 45, pl: '+$41.00' },
];

export const journalByStrategy = [
  { strategy: 'Iron Condor', trades: 6, winRate: '67%', pl: '+$312.00' },
  { strategy: 'Put Credit Spread', trades: 9, winRate: '78%', pl: '+$405.00' },
  { strategy: 'Strangle', trades: 3, winRate: '33%', pl: '-$118.00' },
];

export const greeks = [
  { label: 'Delta', value: '-12.4' },
  { label: 'Theta', value: '+18.7' },
  { label: 'Vega', value: '-42.1' },
  { label: 'Gamma', value: '-0.8' },
];

export const alerts = [
  'SPY condor short call within 1% of price',
  'AAPL earnings in 6 days on open position',
  'Buying power use above 50%',
];

export const screener = [
  { symbol: 'TSLA', ivRank: 62, liquidity: '★★★★', earnings: '2026-11-04' },
  { symbol: 'NVDA', ivRank: 48, liquidity: '★★★★', earnings: '2026-11-19' },
  { symbol: 'XLE', ivRank: 35, liquidity: '★★★', earnings: '—' },
];

export const watchlists = [
  { name: 'High IV', symbols: ['TSLA', 'NVDA', 'COIN'] },
  { name: 'ETFs', symbols: ['SPY', 'QQQ', 'IWM', 'XLE'] },
];

export const optionChain = [
  {
    strike: 570,
    callBid: '12.10',
    callAsk: '12.30',
    putBid: '3.40',
    putAsk: '3.50',
  },
  {
    strike: 575,
    callBid: '8.60',
    callAsk: '8.75',
    putBid: '4.85',
    putAsk: '4.95',
  },
  {
    strike: 580,
    callBid: '5.70',
    callAsk: '5.85',
    putBid: '6.90',
    putAsk: '7.05',
  },
];

export const backtest = [
  { label: 'Strategy', value: '45 DTE 16Δ iron condor, manage at 50%' },
  { label: 'Win rate', value: '74%' },
  { label: 'Avg P&L / trade', value: '+$48' },
  { label: 'Max drawdown', value: '-$620' },
];

export const ticketLegs = [
  { action: 'Sell', qty: 1, type: 'Put', strike: 560, exp: '2026-11-20' },
  { action: 'Buy', qty: 1, type: 'Put', strike: 555, exp: '2026-11-20' },
  { action: 'Sell', qty: 1, type: 'Call', strike: 600, exp: '2026-11-20' },
  { action: 'Buy', qty: 1, type: 'Call', strike: 605, exp: '2026-11-20' },
];

export const practiceOrders = [
  {
    time: '09:42',
    desc: 'SPY iron condor 555/560/600/605',
    status: 'Filled @ 1.45 cr',
  },
  {
    time: '10:15',
    desc: 'QQQ put spread 480/475',
    status: 'Working @ 0.90 cr',
  },
];

export const proposedTrades = [
  {
    desc: 'Sell IWM 210/205 put spread',
    credit: '$1.10',
    margin: '$390',
    bp: '-$390 (3.1%)',
  },
  {
    desc: 'Sell SPY 45 DTE iron condor',
    credit: '$1.60',
    margin: '$340',
    bp: '-$340 (2.7%)',
  },
];

export const suggestedExits = [
  'SPY condor: close at 50% profit (buy back at $0.72)',
  'AAPL put spread: roll out 30 days for a credit',
];

export const rules = [
  'Sell 45 DTE put spreads on SPY when IV rank > 30',
  'Close any position at 50% max profit',
  'Roll tested side at 21 DTE',
];

export const riskLimits = [
  { label: 'Defined-risk only', value: 'Yes', type: 'checkbox' },
  { label: 'Max size per trade ($ risk)', value: '500', type: 'number' },
  { label: 'Max buying power use (%)', value: '50', type: 'number' },
];

export const activityLog = [
  { time: '2026-10-20 09:31', msg: 'Rule 1 matched SPY; trade proposed' },
  { time: '2026-10-20 14:02', msg: 'Rule 2 closed IWM spread at 50%' },
];
