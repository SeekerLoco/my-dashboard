// Larger interactive projected-balance chart: crosshair hover/touch, axis ticks,
// and a day info box listing that day's checkbook transactions.
'use client';

import { useMemo, useRef, useState, useCallback } from 'react';
import { parseLocalDate } from '@/lib/dates';
import { formatUSD } from '@/lib/format';
import type { ProjectionPoint } from '@/lib/types';

export type DayTransaction = {
  id: string;
  Transaction_Date: string;
  Category: string;
  Type: string;
  Amount: number;
  Status: string;
};

type Props = {
  data: ProjectionPoint[];
  transactions: DayTransaction[];
  showBalance: boolean;
};

function formatK(n: number): string {
  if (Math.abs(n) >= 1000) {
    const k = n / 1000;
    const rounded = Math.abs(k) >= 10 ? k.toFixed(0) : k.toFixed(1);
    return `${rounded}k`;
  }
  return String(Math.round(n));
}

function formatAxisDate(dateStr: string, spanDays: number): string {
  const d = parseLocalDate(dateStr);
  if (spanDays > 180) {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
    });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Build ~5-6 y ticks including 0, min, and max. */
function buildYTicks(min: number, max: number): number[] {
  const ticks = new Set<number>([0, min, max]);
  const steps = 4;
  for (let i = 1; i < steps; i++) {
    ticks.add(min + ((max - min) * i) / steps);
  }
  return [...ticks].sort((a, b) => b - a);
}

/** Pick ~5 evenly spaced x indices (always include first and last). */
function buildXTickIndices(length: number): number[] {
  if (length <= 1) return [0];
  const count = Math.min(6, length);
  const indices = new Set<number>();
  for (let i = 0; i < count; i++) {
    indices.add(Math.round((i / (count - 1)) * (length - 1)));
  }
  return [...indices].sort((a, b) => a - b);
}

export default function InteractiveProjectionChart({
  data,
  transactions,
  showBalance,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const width = 720;
  const height = 280;
  const paddingLeft = 52;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 36;

  const { toX, toY, yTicks, xTicks, spanDays, zeroY } = useMemo(() => {
    const balances = data.map((d) => d.balance);
    const minBal = Math.min(...balances, 0);
    const maxBal = Math.max(...balances, 0);
    const range = maxBal - minBal || 1;
    const pad = range * 0.06;
    const min = minBal - pad;
    const max = maxBal + pad;
    const chartW = width - paddingLeft - paddingRight;
    const chartH = height - paddingTop - paddingBottom;
    const toX = (i: number) =>
      paddingLeft + (i / Math.max(data.length - 1, 1)) * chartW;
    const toY = (val: number) =>
      paddingTop + (1 - (val - min) / (max - min || 1)) * chartH;
    const first = parseLocalDate(data[0].date).getTime();
    const last = parseLocalDate(data[data.length - 1].date).getTime();
    const spanDays = Math.max(1, Math.round((last - first) / 86400000));
    return {
      toX,
      toY,
      yTicks: buildYTicks(minBal, maxBal),
      xTicks: buildXTickIndices(data.length),
      spanDays,
      zeroY: toY(0),
    };
  }, [data]);

  const points = useMemo(
    () => data.map((d, i) => `${toX(i)},${toY(d.balance)}`).join(' '),
    [data, toX, toY],
  );

  const firstNegative = useMemo(() => {
    const idx = data.findIndex((d) => d.balance < 0);
    return idx >= 0 ? idx : -1;
  }, [data]);

  const pickIndex = useCallback(
    (clientX: number) => {
      const svg = svgRef.current;
      if (!svg || data.length === 0) return;
      const rect = svg.getBoundingClientRect();
      const xSvg = ((clientX - rect.left) / rect.width) * width;
      const chartW = width - paddingLeft - paddingRight;
      const ratio = (xSvg - paddingLeft) / chartW;
      const idx = Math.round(ratio * (data.length - 1));
      setActiveIndex(Math.max(0, Math.min(data.length - 1, idx)));
    },
    [data.length],
  );

  const onPointerMove = (e: React.PointerEvent) => {
    pickIndex(e.clientX);
  };

  const onPointerLeave = () => setActiveIndex(null);

  if (!data || data.length < 2) {
    return (
      <div className="text-sm text-slate-400 py-8 text-center">
        Not enough projection data for this range.
      </div>
    );
  }

  const active = activeIndex !== null ? data[activeIndex] : null;
  const dayTxs = active
    ? transactions.filter((t) => t.Transaction_Date === active.date)
    : [];

  return (
    <div>
      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="touch-none select-none cursor-crosshair"
        role="img"
        aria-label="Projected checkbook balance"
        onPointerMove={onPointerMove}
        onPointerDown={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        {/* Plot background hit area */}
        <rect
          x={paddingLeft}
          y={paddingTop}
          width={width - paddingLeft - paddingRight}
          height={height - paddingTop - paddingBottom}
          fill="transparent"
        />

        {/* Y-axis */}
        <line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={height - paddingBottom}
          stroke="currentColor"
          strokeWidth="0.75"
          opacity="0.45"
        />
        {/* X-axis */}
        <line
          x1={paddingLeft}
          y1={height - paddingBottom}
          x2={width - paddingRight}
          y2={height - paddingBottom}
          stroke="currentColor"
          strokeWidth="0.75"
          opacity="0.45"
        />

        {/* Y ticks + grid */}
        {yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line
              x1={paddingLeft}
              y1={toY(tick)}
              x2={width - paddingRight}
              y2={toY(tick)}
              stroke="currentColor"
              strokeWidth="0.5"
              strokeDasharray={tick === 0 ? undefined : '3 3'}
              opacity={tick === 0 ? 0 : 0.12}
            />
            <line
              x1={paddingLeft - 4}
              y1={toY(tick)}
              x2={paddingLeft}
              y2={toY(tick)}
              stroke="currentColor"
              strokeWidth="0.75"
              opacity="0.5"
            />
            <text
              x={paddingLeft - 8}
              y={toY(tick) + 3}
              textAnchor="end"
              fontSize="11"
              fill="currentColor"
              opacity="0.7"
            >
              {formatK(tick)}
            </text>
          </g>
        ))}

        {/* Zero baseline (dashed), matching the card */}
        <line
          x1={paddingLeft}
          y1={zeroY}
          x2={width - paddingRight}
          y2={zeroY}
          stroke="currentColor"
          strokeWidth="0.75"
          strokeDasharray="4 3"
          opacity="0.45"
        />

        {/* X tick labels */}
        {xTicks.map((i) => (
          <text
            key={`x-${i}`}
            x={toX(i)}
            y={height - paddingBottom + 18}
            textAnchor={
              i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'
            }
            fontSize="11"
            fill="currentColor"
            opacity="0.7"
          >
            {formatAxisDate(data[i].date, spanDays)}
          </text>
        ))}

        {/* Balance line */}
        <polyline
          fill="none"
          stroke="#60a5fa"
          strokeWidth="2"
          points={points}
        />

        {/* First-negative date label (same cue as the card) */}
        {firstNegative >= 0 && activeIndex === null && (
          <text
            x={toX(firstNegative)}
            y={toY(data[firstNegative].balance) - 10}
            textAnchor="middle"
            fontSize="11"
            fill="#ffffff"
            opacity="0.9"
          >
            {formatAxisDate(data[firstNegative].date, spanDays)}
          </text>
        )}

        {/* Active crosshair + point */}
        {active && activeIndex !== null && (
          <g>
            <line
              x1={toX(activeIndex)}
              y1={paddingTop}
              x2={toX(activeIndex)}
              y2={height - paddingBottom}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.7"
            />
            <circle
              cx={toX(activeIndex)}
              cy={toY(active.balance)}
              r={5}
              fill="#60a5fa"
              stroke="#0b0e24"
              strokeWidth="2"
            />
            {/* Floating date + balance near the point */}
            <g
              transform={`translate(${Math.min(
                Math.max(toX(activeIndex), paddingLeft + 70),
                width - paddingRight - 70,
              )}, ${Math.max(toY(active.balance) - 28, paddingTop + 4)})`}
            >
              <rect
                x={-68}
                y={-14}
                width={136}
                height={28}
                rx={6}
                fill="rgba(22, 28, 64, 0.95)"
                stroke="rgba(148, 163, 255, 0.35)"
              />
              <text textAnchor="middle" y={4} fontSize="11" fill="#e2e8f0">
                {formatAxisDate(active.date, spanDays)}
                {' · '}
                {showBalance ? formatUSD(active.balance) : '******'}
              </text>
            </g>
          </g>
        )}
      </svg>

      {/* Day info box */}
      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 min-h-[88px]">
        {active ? (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
              <div className="text-sm font-semibold">
                {formatFullDate(active.date)}
              </div>
              <div className="text-sm text-slate-300">
                Projected:{' '}
                <span
                  className={
                    showBalance
                      ? active.balance < 0
                        ? 'text-red-400 font-semibold'
                        : 'text-sky-300 font-semibold'
                      : 'font-semibold'
                  }
                >
                  {showBalance ? formatUSD(active.balance) : '******'}
                </span>
              </div>
            </div>
            {dayTxs.length === 0 ? (
              <div className="text-xs text-slate-400">
                No transactions on this day.
              </div>
            ) : (
              <ul className="space-y-1.5">
                {dayTxs.map((tx) => (
                  <li
                    key={tx.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
                  >
                    <span className="truncate max-w-[12rem] sm:max-w-[16rem]">
                      {tx.Category}
                    </span>
                    <span className="text-xs text-slate-400 w-14">
                      {tx.Type}
                    </span>
                    <span
                      className={`ml-auto tabular-nums ${
                        tx.Amount < 0 ? 'text-red-400' : 'text-green-400'
                      }`}
                    >
                      {showBalance ? formatUSD(tx.Amount) : '******'}
                    </span>
                    <span className="text-xs text-slate-400 w-16 text-right">
                      {tx.Status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <div className="text-sm text-slate-400 py-4 text-center">
            Hover or drag along the chart to see that day&apos;s balance and
            transactions.
          </div>
        )}
      </div>
    </div>
  );
}
