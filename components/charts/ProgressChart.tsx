// SDLT progress line chart: running actual value vs. the goal line, with a
// straight-line trend out to the end date. Year ticks and a hover/touch
// readout show Actual and Trend at each month.
'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { addMonths, parseLocalDate } from '@/lib/dates';
import { formatUSD } from '@/lib/format';

export type ChartRow = {
  'End of Month': string;
  running_actual: number;
};

// Savings goal shown as the red dashed line.
const GOAL = 100000;

// Last month on the chart's x-axis (and end of the trend line).
const END_DATE = '2040-12-01';

const WIDTH = 700;
const HEIGHT = 320;
const PAD_LEFT = 60;
const PAD_RIGHT = 20;
const PAD_TOP = 20;
const PAD_BOTTOM = 40;

function parseMonth(value: string): Date {
  return parseLocalDate(value.slice(0, 10));
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function monthIndexOf(date: Date, origin: Date): number {
  return (
    (date.getFullYear() - origin.getFullYear()) * 12 +
    (date.getMonth() - origin.getMonth())
  );
}

export default function ProgressChart({ data }: { data: ChartRow[] }) {
  if (data.length < 2)
    return <div className="text-sm opacity-60">Not enough data</div>;

  return <ProgressChartInner data={data} />;
}

function ProgressChartInner({ data }: { data: ChartRow[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const yMax = 110000;
  const yMin = 0;

  const geometry = useMemo(() => {
    const firstDate = parseMonth(data[0]['End of Month']);
    const endDate = parseMonth(END_DATE);
    const totalMonths = monthIndexOf(endDate, firstDate);
    const chartW = WIDTH - PAD_LEFT - PAD_RIGHT;
    const chartH = HEIGHT - PAD_TOP - PAD_BOTTOM;

    const toX = (monthIndex: number) =>
      PAD_LEFT + (monthIndex / totalMonths) * chartW;
    const toY = (val: number) =>
      PAD_TOP + (1 - (val - yMin) / (yMax - yMin)) * chartH;

    const actualByMonth = new Map<number, number>();
    for (const row of data) {
      actualByMonth.set(
        monthIndexOf(parseMonth(row['End of Month']), firstDate),
        row.running_actual,
      );
    }

    const points = data
      .map((d) => {
        const monthIndex = monthIndexOf(
          parseMonth(d['End of Month']),
          firstDate,
        );
        return `${toX(monthIndex)},${toY(d.running_actual)}`;
      })
      .join(' ');

    // Straight-line (least-squares) fit through the actual values, extended to the end date
    const n = data.length;
    const sumX = data.reduce((s, _, i) => s + i, 0);
    const sumY = data.reduce((s, d) => s + d.running_actual, 0);
    const sumXY = data.reduce((s, d, i) => s + i * d.running_actual, 0);
    const sumXX = data.reduce((s, _, i) => s + i * i, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const trendEndVal = intercept + slope * totalMonths;

    const years: { year: number; monthIndex: number }[] = [];
    const startYear = firstDate.getFullYear();
    const endYear = endDate.getFullYear();
    for (let year = startYear; year <= endYear; year++) {
      const january = new Date(year, 0, 1);
      const rawIndex = monthIndexOf(january, firstDate);
      const monthIndex = year === startYear ? 0 : rawIndex;
      if (monthIndex < 0 || monthIndex > totalMonths) continue;
      years.push({ year, monthIndex });
    }

    return {
      firstDate,
      totalMonths,
      toX,
      toY,
      points,
      actualByMonth,
      slope,
      intercept,
      trendEndVal,
      years,
    };
  }, [data]);

  const {
    firstDate,
    totalMonths,
    toX,
    toY,
    points,
    actualByMonth,
    slope,
    intercept,
    trendEndVal,
    years,
  } = geometry;

  const pickIndex = useCallback(
    (clientX: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const xSvg = ((clientX - rect.left) / rect.width) * WIDTH;
      const chartW = WIDTH - PAD_LEFT - PAD_RIGHT;
      const ratio = (xSvg - PAD_LEFT) / chartW;
      const idx = Math.round(ratio * totalMonths);
      setActiveIndex(Math.max(0, Math.min(totalMonths, idx)));
    },
    [totalMonths],
  );

  const onPointerMove = (e: React.PointerEvent) => {
    pickIndex(e.clientX);
  };

  const onPointerLeave = () => setActiveIndex(null);

  const ticks = [0, 25000, 50000, 75000, 100000];

  const active =
    activeIndex !== null
      ? {
          monthIndex: activeIndex,
          date: addMonths(firstDate, activeIndex),
          actual: actualByMonth.get(activeIndex),
          trend: intercept + slope * activeIndex,
        }
      : null;

  let tooltip: {
    tooltipW: number;
    tooltipH: number;
    tooltipX: number;
    tooltipY: number;
    actualY: number | undefined;
    trendY: number | undefined;
    x: number;
  } | null = null;
  if (active) {
    const tooltipW = 158;
    const tooltipH = 54;
    const x = toX(active.monthIndex);
    const actualY =
      active.actual !== undefined ? toY(active.actual) : undefined;
    const trendY =
      active.trend >= yMin && active.trend <= yMax
        ? toY(active.trend)
        : undefined;
    const topY = Math.min(actualY ?? Infinity, trendY ?? Infinity);
    const bottomY = Math.max(actualY ?? -Infinity, trendY ?? -Infinity);
    const above = Number.isFinite(topY) && topY - tooltipH - 8 >= PAD_TOP;
    const tooltipX = Math.min(
      Math.max(x - tooltipW / 2, PAD_LEFT),
      WIDTH - PAD_RIGHT - tooltipW,
    );
    const tooltipY = above
      ? topY - tooltipH - 8
      : Number.isFinite(bottomY)
        ? Math.min(bottomY + 8, HEIGHT - PAD_BOTTOM - tooltipH)
        : PAD_TOP;
    tooltip = { tooltipW, tooltipH, tooltipX, tooltipY, actualY, trendY, x };
  }

  return (
    <svg
      ref={svgRef}
      width="100%"
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="touch-none select-none cursor-crosshair"
      role="img"
      aria-label="SDLT progress toward goal"
      onPointerMove={onPointerMove}
      onPointerDown={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <rect
        x={PAD_LEFT}
        y={PAD_TOP}
        width={WIDTH - PAD_LEFT - PAD_RIGHT}
        height={HEIGHT - PAD_TOP - PAD_BOTTOM}
        fill="transparent"
      />
      <line
        x1={PAD_LEFT}
        y1={PAD_TOP}
        x2={PAD_LEFT}
        y2={HEIGHT - PAD_BOTTOM}
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.4"
      />
      <line
        x1={PAD_LEFT}
        y1={HEIGHT - PAD_BOTTOM}
        x2={WIDTH - PAD_RIGHT}
        y2={HEIGHT - PAD_BOTTOM}
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.4"
      />
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={PAD_LEFT}
            y1={toY(tick)}
            x2={WIDTH - PAD_RIGHT}
            y2={toY(tick)}
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray={tick === 0 ? undefined : '3 3'}
            opacity={tick === 0 ? 0 : 0.12}
          />
          <line
            x1={PAD_LEFT - 4}
            y1={toY(tick)}
            x2={PAD_LEFT}
            y2={toY(tick)}
            stroke="currentColor"
            strokeWidth="0.75"
            opacity="0.4"
          />
          <text
            x={PAD_LEFT - 8}
            y={toY(tick) + 3}
            textAnchor="end"
            fontSize="10"
            fill="currentColor"
            opacity="0.7"
          >
            ${(tick / 1000).toFixed(0)}k
          </text>
        </g>
      ))}
      {years.map(({ year, monthIndex }, i) => (
        <g key={year}>
          <line
            x1={toX(monthIndex)}
            y1={PAD_TOP}
            x2={toX(monthIndex)}
            y2={HEIGHT - PAD_BOTTOM}
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.12"
          />
          <line
            x1={toX(monthIndex)}
            y1={HEIGHT - PAD_BOTTOM}
            x2={toX(monthIndex)}
            y2={HEIGHT - PAD_BOTTOM + 4}
            stroke="currentColor"
            strokeWidth="0.75"
            opacity="0.4"
          />
          <text
            x={toX(monthIndex)}
            y={HEIGHT - 12}
            textAnchor={
              i === 0 ? 'start' : i === years.length - 1 ? 'end' : 'middle'
            }
            fontSize="10"
            fill="currentColor"
            opacity="0.7"
          >
            {year}
          </text>
        </g>
      ))}
      <line
        x1={PAD_LEFT}
        y1={toY(GOAL)}
        x2={WIDTH - PAD_RIGHT}
        y2={toY(GOAL)}
        stroke="#f87171"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <text
        x={WIDTH - PAD_RIGHT - 4}
        y={toY(GOAL) - 6}
        textAnchor="end"
        fontSize="10"
        fill="#f87171"
      >
        ${GOAL / 1000}k goal
      </text>
      <line
        x1={toX(0)}
        y1={toY(intercept)}
        x2={toX(totalMonths)}
        y2={toY(trendEndVal)}
        stroke="#a78bfa"
        strokeWidth="1.5"
        strokeDasharray="3 2"
      />
      <polyline fill="none" stroke="#60a5fa" strokeWidth="2" points={points} />
      {active && tooltip && (
        <g>
          <line
            x1={tooltip.x}
            y1={PAD_TOP}
            x2={tooltip.x}
            y2={HEIGHT - PAD_BOTTOM}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.7"
          />
          {tooltip.trendY !== undefined && (
            <circle
              cx={tooltip.x}
              cy={tooltip.trendY}
              r={5}
              fill="#a78bfa"
              stroke="#0b0e24"
              strokeWidth="2"
            />
          )}
          {tooltip.actualY !== undefined && (
            <circle
              cx={tooltip.x}
              cy={tooltip.actualY}
              r={5}
              fill="#60a5fa"
              stroke="#0b0e24"
              strokeWidth="2"
            />
          )}
          <g transform={`translate(${tooltip.tooltipX}, ${tooltip.tooltipY})`}>
            <rect
              width={tooltip.tooltipW}
              height={tooltip.tooltipH}
              rx={6}
              fill="rgba(22, 28, 64, 0.95)"
              stroke="rgba(148, 163, 255, 0.35)"
            />
            <text x={10} y={16} fontSize="11" fill="#e2e8f0">
              {formatMonthYear(active.date)}
            </text>
            <text x={10} y={32} fontSize="11" fill="#60a5fa">
              {`Actual  ${
                active.actual !== undefined ? formatUSD(active.actual) : '—'
              }`}
            </text>
            <text x={10} y={46} fontSize="11" fill="#a78bfa">
              {`Trend   ${formatUSD(active.trend)}`}
            </text>
          </g>
        </g>
      )}
    </svg>
  );
}
