// Shared data shapes used by more than one component.

// One day of projected checkbook balance (daily_balances.projected_balance).
export type ProjectionPoint = { date: string; balance: number };

// One month of SDLT interest (sdlt_progress_summary.monthly_interest_from_tx).
export type InterestPoint = { date: string; interest: number };
