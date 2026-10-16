// 90-day projected checkbook balance line chart, labeling the first date it goes negative.

import { parseLocalDate } from '@/lib/dates';
import type { ProjectionPoint } from '@/lib/types';

export default function ProjectionChart({ data }: { data: ProjectionPoint[] }) {
  if (!data || data.length < 2) return null;

  const width = 280;
  const height = 90;
  const paddingLeft = 36;
  const paddingRight = 8;
  const paddingTop = 8;
  const paddingBottom = 8;

  const balances = data.map((d) => d.balance);
  const min = Math.min(...balances, 0);
  const max = Math.max(...balances, 0);
  const range = max - min || 1;

  const toX = (i: number) =>
    paddingLeft +
    (i / (data.length - 1)) * (width - paddingLeft - paddingRight);
  const toY = (val: number) =>
    paddingTop +
    (1 - (val - min) / range) * (height - paddingTop - paddingBottom);

  const points = data.map((d, i) => `${toX(i)},${toY(d.balance)}`).join(' ');
  const zeroY = toY(0);

  // First date the balance goes below zero
  const firstNegative = data.find((d) => d.balance < 0);
  const firstNegativeIndex = firstNegative ? data.indexOf(firstNegative) : -1;

  // Simple tick values
  const ticks = [max, 0, min].filter((v, i, arr) => arr.indexOf(v) === i);

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="mt-3"
    >
      {/* Y-axis line */}
      <line
        x1={paddingLeft}
        y1={paddingTop}
        x2={paddingLeft}
        y2={height - paddingBottom}
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.5"
      />

      {/* Ticks and labels */}
      {ticks.map((tick) => (
        <g key={tick}>
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
            x={paddingLeft - 6}
            y={toY(tick) + 3}
            textAnchor="end"
            fontSize="8"
            fill="currentColor"
            opacity="0.7"
          >
            {tick >= 1000 || tick <= -1000
              ? `${(tick / 1000).toFixed(1)}k`
              : Math.round(tick)}
          </text>
        </g>
      ))}

      {/* Zero line */}
      <line
        x1={paddingLeft}
        y1={zeroY}
        x2={width - paddingRight}
        y2={zeroY}
        stroke="currentColor"
        strokeWidth="0.5"
        strokeDasharray="2 2"
        opacity="0.4"
      />

      {/* Balance line */}
      <polyline
        fill="none"
        stroke="#60a5fa"
        strokeWidth="1.5"
        points={points}
      />

      {/* First negative date label */}
      {firstNegative && firstNegativeIndex >= 0 && (
        <text
          x={toX(firstNegativeIndex)}
          y={toY(firstNegative.balance) - 6}
          textAnchor="middle"
          fontSize="10"
          fill="#ffffff"
        >
          {parseLocalDate(firstNegative.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </text>
      )}
    </svg>
  );
}
