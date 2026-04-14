/**
 * Canonical staleTime tiers for React Query.
 *
 * Pick a tier based on how often the data changes and how tolerant the UI is
 * to showing a slightly-stale value on focus/refocus.
 */
export const STALE_TIME = {
  /** 30s — data that changes as the user works (tasks, comments) */
  VOLATILE: 30_000,
  /** 1 min — lists like plans, properties, budgets */
  MEDIUM: 60_000,
  /** 5 min — append-only or infrequently-updated: photos, expenses, health, audit logs */
  SLOW: 5 * 60_000,
} as const;
