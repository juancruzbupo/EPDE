/**
 * Canonical staleTime tiers for React Query (mirrors apps/web/src/hooks/query-stale-times.ts).
 *
 * Pick a tier based on how often the data changes and how tolerant the UI is
 * to showing a slightly-stale value on focus/refocus.
 *
 * Mobile's global default is 2 min; always picking an explicit tier here makes
 * cache tuning visible and searchable (grep STALE_TIME.X) instead of invisible
 * via inherited defaults.
 */
export const STALE_TIME = {
  /** 30s — data that changes as the user works (tasks, comments, notifications) */
  VOLATILE: 30_000,
  /** 1 min — lists like plans, properties, budgets, service-requests */
  MEDIUM: 60_000,
  /** 5 min — append-only or infrequently-updated: photos, expenses, health, milestones, audit logs */
  SLOW: 5 * 60_000,
} as const;
