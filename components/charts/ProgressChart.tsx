// SDLT progress line chart: running actual value vs. the goal line, with a straight-line trend out to the end date.

export type ChartRow = {
  'End of Month': string;
  running_actual: number;
};

// Savings goal shown as the red dashed line.
const GOAL = 100000;

// Last month on the chart's x-axis (and end of the trend line).
const END_DATE = '2040-12-01';

export default function ProgressChart({ data }: { data: ChartRow[] }) {
  if (data.length < 2)
    return <div className="text-sm opacity-60">Not enough data</div>;

  const width = 700;
  const height = 320;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const yMax = 110000;
  const yMin = 0;

  const firstDate = new Date(data[0]['End of Month']);
  const endDate = new Date(END_DATE);
  const totalMonths =
    (endDate.getFullYear() - firstDate.getFullYear()) * 12 +
    (endDate.getMonth() - firstDate.getMonth());

  const toX = (monthIndex: number) =>
    paddingLeft +
    (monthIndex / totalMonths) * (width - paddingLeft - paddingRight);
  const toY = (val: number) =>
    paddingTop +
    (1 - (val - yMin) / (yMax - yMin)) * (height - paddingTop - paddingBottom);

  const points = data
    .map((d) => {
      const dDate = new Date(d['End of Month']);
      const monthIndex =
        (dDate.getFullYear() - firstDate.getFullYear()) * 12 +
        (dDate.getMonth() - firstDate.getMonth());
      return `${toX(monthIndex)},${toY(d.running_actual)}`;
    })
    .join(' ');

  const n = data.length;
  const sumX = data.reduce((s, _, i) => s + i, 0);
  const sumY = data.reduce((s, d) => s + d.running_actual, 0);
  const sumXY = data.reduce((s, d, i) => s + i * d.running_actual, 0);
  const sumXX = data.reduce((s, _, i) => s + i * i, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const trendEndVal = intercept + slope * totalMonths;

  const ticks = [0, 25000, 50000, 75000, 100000];

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <line
        x1={paddingLeft}
        y1={paddingTop}
        x2={paddingLeft}
        y2={height - paddingBottom}
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.4"
      />
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={paddingLeft - 4}
            y1={toY(tick)}
            x2={paddingLeft}
            y2={toY(tick)}
            stroke="currentColor"
            strokeWidth="0.75"
            opacity="0.4"
          />
          <text
            x={paddingLeft - 8}
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
      <line
        x1={paddingLeft}
        y1={toY(GOAL)}
        x2={width - paddingRight}
        y2={toY(GOAL)}
        stroke="#f87171"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <text
        x={width - paddingRight - 4}
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
      <text
        x={toX(0)}
        y={height - 10}
        fontSize="10"
        fill="currentColor"
        opacity="0.7"
      >
        {data[0]['End of Month'].slice(0, 4)}
      </text>
      <text
        x={toX(totalMonths)}
        y={height - 10}
        textAnchor="end"
        fontSize="10"
        fill="currentColor"
        opacity="0.7"
      >
        {END_DATE.slice(0, 4)}
      </text>
    </svg>
  );
}
