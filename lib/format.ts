// Number formatting helpers.

// Formats a number as US dollars, e.g. -1234.5 → "-$1,234.50".
export function formatUSD(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
