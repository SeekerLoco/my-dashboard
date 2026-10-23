// Account value line chart: net liquidating value over time (Denver-time labels), used by the tastytrade Watch page.
import { money, asOfDenver, type TtBalancePoint } from '@/lib/tastytrade';

export default function AccountValueChart({
  points,
}: {
  points: TtBalancePoint[];
}) {
  if (points.length < 2) return null;

  const width = 700;
  const height = 220;
  const paddingLeft = 70;
  const paddingRight = 20;
  const paddingTop = 16;
  const paddingBottom = 36;

  const times = points.map((p) => new Date(p.as_of).getTime());
  const values = points.map((p) => p.net_liq);
  const t0 = times[0];
  const tSpan = times[times.length - 1] - t0 || 1;
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  // Pad the y range so a flat line still sits mid-chart.
  const pad = (rawMax - rawMin) * 0.1 || Math.abs(rawMax) * 0.01 || 1;
  const min = rawMin - pad;
  const max = rawMax + pad;

  const toX = (t: number) =>
    paddingLeft + ((t - t0) / tSpan) * (width - paddingLeft - paddingRight);
  const toY = (v: number) =>
    paddingTop +
    (1 - (v - min) / (max - min)) * (height - paddingTop - paddingBottom);

  const line = points
    .map((p, i) => `${toX(times[i])},${toY(p.net_liq)}`)
    .join(' ');
  const yTicks = [rawMax, (rawMax + rawMin) / 2, rawMin].filter(
    (v, i, arr) => arr.indexOf(v) === i,
  );
  const xTicks = [
    0,
    Math.floor((points.length - 1) / 2),
    points.length - 1,
  ].filter((v, i, arr) => arr.indexOf(v) === i);
  const last = points.length - 1;
  const up = values[last] >= values[0];
  const color = up ? '#4ade80' : '#f87171';

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      className="mt-2"
      role="img"
      aria-label="Account value over time"
    >
      <line
        x1={paddingLeft}
        y1={paddingTop}
        x2={paddingLeft}
        y2={height - paddingBottom}
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.5"
      />
      <line
        x1={paddingLeft}
        y1={height - paddingBottom}
        x2={width - paddingRight}
        y2={height - paddingBottom}
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.5"
      />
      {yTicks.map((v) => (
        <g key={v}>
          <line
            x1={paddingLeft}
            y1={toY(v)}
            x2={width - paddingRight}
            y2={toY(v)}
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="3 3"
            opacity="0.15"
          />
          <text
            x={paddingLeft - 6}
            y={toY(v) + 3}
            textAnchor="end"
            fontSize="11"
            fill="currentColor"
            opacity="0.7"
          >
            {money(v)}
          </text>
        </g>
      ))}
      {xTicks.map((i) => (
        <text
          key={i}
          x={toX(times[i])}
          y={height - paddingBottom + 16}
          textAnchor={i === 0 ? 'start' : i === last ? 'end' : 'middle'}
          fontSize="11"
          fill="currentColor"
          opacity="0.7"
        >
          {asOfDenver(points[i].as_of)}
        </text>
      ))}
      <polyline fill="none" stroke={color} strokeWidth="2" points={line} />
      {points.map((p, i) => (
        <circle
          key={p.as_of}
          cx={toX(times[i])}
          cy={toY(p.net_liq)}
          r={i === last ? 4 : 2.5}
          fill={color}
        >
          <title>{`${asOfDenver(p.as_of)}: ${money(p.net_liq)}`}</title>
        </circle>
      ))}
    </svg>
  );
}
