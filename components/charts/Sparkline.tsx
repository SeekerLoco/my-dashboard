// Tiny line chart of recent prices with a dotted line at the opening price (used by the Markets card).

export default function Sparkline({
  data,
  positive,
}: {
  data: number[];
  positive: boolean;
}) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 20;

  // Opening / reference price is the first point
  const open = data[0];
  const openY = height - ((open - min) / range) * height;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="inline-block ml-2">
      {/* Dotted line at opening price */}
      <line
        x1="0"
        y1={openY}
        x2={width}
        y2={openY}
        stroke={positive ? '#4ade80' : '#f87171'}
        strokeWidth="0.75"
        strokeDasharray="2 2"
        opacity="0.6"
      />
      {/* Price line */}
      <polyline
        fill="none"
        stroke={positive ? '#4ade80' : '#f87171'}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}
