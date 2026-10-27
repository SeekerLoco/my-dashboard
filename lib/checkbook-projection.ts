// Shared checkbook projection ranges and fetch (daily_balances.projected_balance).
// The Checkbook card and the transactions-page chart both use this so the default
// window stays identical (today → today+90 days).

import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dates';
import type { ProjectionPoint } from '@/lib/types';

export const PROJECTION_RANGE_DAYS = {
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  All: null,
} as const;

export type ProjectionRangeKey = keyof typeof PROJECTION_RANGE_DAYS;

/** Matches the Checkbook card's 90-day window. */
export const DEFAULT_PROJECTION_RANGE: ProjectionRangeKey = '3M';

export const PROJECTION_RANGE_KEYS = Object.keys(
  PROJECTION_RANGE_DAYS,
) as ProjectionRangeKey[];

/** Fetches projected_balance rows from today through the selected forward window. */
export async function fetchProjectedBalances(
  range: ProjectionRangeKey = DEFAULT_PROJECTION_RANGE,
): Promise<ProjectionPoint[]> {
  const today = getLocalDateString();
  const days = PROJECTION_RANGE_DAYS[range];

  let query = supabase
    .from('daily_balances')
    .select('calendar_date, projected_balance')
    .gte('calendar_date', today)
    .order('calendar_date');

  if (days !== null) {
    const end = new Date();
    end.setDate(end.getDate() + days);
    query = query.lte('calendar_date', getLocalDateString(end));
  }

  const { data } = await query;
  if (!data) return [];
  return data.map((row) => ({
    date: row.calendar_date,
    balance: row.projected_balance as number,
  }));
}
