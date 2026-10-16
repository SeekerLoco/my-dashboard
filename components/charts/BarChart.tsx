// Clickable bar chart for the Soccer and SDLT Charts pages; `variant` keeps each page's original sizing.

export type BarDatum = {
  key: string;
  total: number;
  expected?: number;
  verified?: number;
};

// Sizes from the original per-page charts: 'compact' = Soccer, 'large' = SDLT Charts.
const VARIANTS = {
  compact: {
    maxBarWidth: 40,
    fitWidth: 480,
    gap: 12,
    extraWidth: 60,
    height: 220,
    paddingLeft: 50,
    paddingTop: 15,
    barOffset: 8,
    tickLabelGap: 6,
    tickFont: '9',
    valueFont: '8',
    labelFont: '9',
    tickPrefix: '',
  },
  large: {
    maxBarWidth: 48,
    fitWidth: 560,
    gap: 10,
    extraWidth: 70,
    height: 260,
    paddingLeft: 55,
    paddingTop: 20,
    barOffset: 10,
    tickLabelGap: 8,
    tickFont: '11',
    valueFont: '11',
    labelFont: '11',
    tickPrefix: '$',
  },
};

const PADDING_BOTTOM = 30;

export default function BarChart({
  data,
  onBarClick,
  color = '#60a5fa',
  split = false,
  variant = 'compact',
}: {
  data: BarDatum[];
  onBarClick?: (key: string) => void;
  color?: string;
  // Draws Expected (yellow) and Verified (green) side by side instead of one total bar.
  split?: boolean;
  variant?: keyof typeof VARIANTS;
}) {
  if (!data.length) return <div className="text-sm opacity-60">No data</div>;

  const v = VARIANTS[variant];
  const max = Math.max(
    ...data.map((d) =>
      split ? Math.max(d.expected ?? 0, d.verified ?? 0) : d.total,
    ),
    1,
  );
  const barWidth = Math.min(v.maxBarWidth, v.fitWidth / data.length);
  const chartWidth = data.length * (barWidth + v.gap) + v.extraWidth;
  const chartHeight = v.height;

  const toY = (val: number) =>
    chartHeight -
    PADDING_BOTTOM -
    (val / max) * (chartHeight - PADDING_BOTTOM - v.paddingTop);

  const ticks = [0, max / 2, max];
  const barClass = onBarClick ? 'cursor-pointer' : '';

  return (
    <svg
      width="100%"
      height={chartHeight}
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
    >
      {/* Y-axis line */}
      <line
        x1={v.paddingLeft}
        y1={v.paddingTop}
        x2={v.paddingLeft}
        y2={chartHeight - PADDING_BOTTOM}
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.4"
      />

      {/* Y-axis ticks and labels */}
      {ticks.map((tick, i) => (
        <g key={i}>
          <line
            x1={v.paddingLeft - 4}
            y1={toY(tick)}
            x2={v.paddingLeft}
            y2={toY(tick)}
            stroke="currentColor"
            strokeWidth="0.75"
            opacity="0.4"
          />
          <text
            x={v.paddingLeft - v.tickLabelGap}
            y={toY(tick) + 3}
            textAnchor="end"
            fontSize={v.tickFont}
            fill="currentColor"
            opacity="0.7"
          >
            {v.tickPrefix}
            {Math.round(tick).toLocaleString()}
          </text>
        </g>
      ))}

      {/* Bars */}
      {data.map((d, i) => {
        const x = v.paddingLeft + v.barOffset + i * (barWidth + v.gap);
        const label = (
          <text
            x={x + barWidth / 2}
            y={chartHeight - 8}
            textAnchor="middle"
            fontSize={v.labelFont}
            fill="currentColor"
          >
            {d.key.length > 7 ? d.key.slice(5) : d.key}
          </text>
        );

        if (split) {
          const expected = d.expected ?? 0;
          const verified = d.verified ?? 0;
          return (
            <g
              key={d.key}
              onClick={() => onBarClick?.(d.key)}
              className={barClass}
            >
              <rect
                x={x}
                y={toY(expected)}
                width={barWidth / 2 - 1}
                height={chartHeight - PADDING_BOTTOM - toY(expected)}
                fill="#fbbf24"
              />
              <rect
                x={x + barWidth / 2}
                y={toY(verified)}
                width={barWidth / 2 - 1}
                height={chartHeight - PADDING_BOTTOM - toY(verified)}
                fill="#34d399"
              />
              <text
                x={x + barWidth / 4}
                y={toY(expected) - 4}
                textAnchor="middle"
                fontSize={v.valueFont}
                fill="currentColor"
              >
                {expected ? Math.round(expected).toLocaleString() : ''}
              </text>
              <text
                x={x + (barWidth * 3) / 4}
                y={toY(verified) - 4}
                textAnchor="middle"
                fontSize={v.valueFont}
                fill="currentColor"
              >
                {verified ? Math.round(verified).toLocaleString() : ''}
              </text>
              {label}
            </g>
          );
        }

        return (
          <g
            key={d.key}
            onClick={() => onBarClick?.(d.key)}
            className={barClass}
          >
            <rect
              x={x}
              y={toY(d.total)}
              width={barWidth}
              height={chartHeight - PADDING_BOTTOM - toY(d.total)}
              fill={color}
            />
            <text
              x={x + barWidth / 2}
              y={toY(d.total) - 4}
              textAnchor="middle"
              fontSize={v.valueFont}
              fill="currentColor"
            >
              {Math.round(d.total).toLocaleString()}
            </text>
            {label}
          </g>
        );
      })}
    </svg>
  );
}
