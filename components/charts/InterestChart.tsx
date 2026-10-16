// Monthly interest history line chart with year labels and the max value marked (used by the SDLT card).

import { parseLocalDate } from '@/lib/dates';
import type { InterestPoint } from '@/lib/types';

export default function InterestChart({ data }: { data: InterestPoint[] }) {
  if (!data || data.length < 2) return null;

  const width = 280;
  const height = 100;
  const paddingLeft = 40;
  const paddingRight = 12;
  const paddingTop = 16;
  const paddingBottom = 36;

  const values = data.map((d) => d.interest);
  const min = Math.min(...values, 0);
  const max = Math.max(...values);
  const range = max - min || 1;

  const toX = (i: number) =>
    paddingLeft +
    (i / (data.length - 1)) * (width - paddingLeft - paddingRight);
  const toY = (val: number) =>
    paddingTop +
    (1 - (val - min) / range) * (height - paddingTop - paddingBottom);

  const points = data.map((d, i) => `${toX(i)},${toY(d.interest)}`).join(' ');

  const maxIndex = values.indexOf(max);
  const ticks = [max, Math.round((max + min) / 2), min].filter(
    (v, i, arr) => arr.indexOf(v) === i,
  );

  // Find the first occurrence of each year for x-axis labels
  const yearLabels: { year: string; index: number }[] = [];
  let lastYear = '';
  data.forEach((d, i) => {
    const year = d.date.slice(0, 4);
    if (year !== lastYear) {
      yearLabels.push({ year, index: i });
      lastYear = year;
    }
  });

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="mt-3"
    >
      {/* Y-axis */}
      <line
        x1={paddingLeft}
        y1={paddingTop}
        x2={paddingLeft}
        y2={height - paddingBottom}
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.5"
      />

      {/* Y ticks */}
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
            ${Math.round(tick)}
          </text>
        </g>
      ))}

      {/* X-axis year labels (vertical)(short form) */}
      {/* X-axis year labels (short form) */}
      {yearLabels.map(({ year, index }) => (
        <text
          key={year}
          x={toX(index)}
          y={height - 4}
          textAnchor="middle"
          fontSize="8"
          fill="currentColor"
          opacity="0.6"
        >
          '{year.slice(2)}
        </text>
      ))}
      {/* Line */}
      <polyline
        fill="none"
        stroke="#34d399"
        strokeWidth="1.5"
        points={points}
      />

      {/* Max value label */}
      <text
        x={toX(maxIndex)}
        y={toY(max) - 6}
        textAnchor="middle"
        fontSize="9"
        fill="#34d399"
        fontWeight="600"
      >
        ${Math.round(max)},{' '}
        {parseLocalDate(data[maxIndex].date).toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        })}
      </text>
    </svg>
  );
}
