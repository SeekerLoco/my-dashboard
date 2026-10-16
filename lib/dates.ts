// Date helpers: local YYYY-MM-DD formatting/parsing and month math (no UTC shift).
export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parses a 'YYYY-MM-DD' string as local midnight (new Date('YYYY-MM-DD') would use UTC).
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Adds n months (n may be negative), clamping to the target month's last day (Mar 31 - 1 month = Feb 28/29).
export function addMonths(date: Date, n: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + n, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
}
