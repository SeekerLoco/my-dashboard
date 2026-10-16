// Year → month → day drill-down helpers shared by the Soccer and SDLT Charts bar charts.

export type Level = 'year' | 'month' | 'day';

// Groups items by year, month, or day of their 'YYYY-MM-DD' date, sorted by key.
// At month/day level, only items whose date starts with `filter` are kept.
export function groupByPeriod<T>(
  items: T[],
  getDate: (item: T) => string,
  level: Level,
  filter: string | null,
): { key: string; items: T[] }[] {
  let filtered = items;
  if (filter && level !== 'year') {
    filtered = filtered.filter((item) => getDate(item).startsWith(filter));
  }
  const groups: Record<string, T[]> = {};
  filtered.forEach((item) => {
    const d = getDate(item);
    let key = d.slice(0, 4);
    if (level === 'month') key = d.slice(0, 7);
    if (level === 'day') key = d;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => ({ key, items }));
}

// The level a bar click drills into, or null at the deepest (day) level.
export function nextLevel(level: Level): Level | null {
  if (level === 'year') return 'month';
  if (level === 'month') return 'day';
  return null;
}
