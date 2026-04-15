/**
 * Canonical staleTime tiers for React Query — shared across web + mobile.
 *
 * Pick a tier based on how often the data changes and how tolerant the UI is
 * to showing a slightly-stale value on focus/refocus.
 *
 * Why centralized:
 *   - Avoids drift between web and mobile (previously each app had its own
 *     query-stale-times.ts file with the same values — easy to drift apart
 *     silently).
 *   - Makes cache tuning visible and grep-able (`STALE_TIME.VOLATILE`)
 *     instead of invisible via inherited defaults.
 *   - Mobile's QueryClient default is 2 min; web's is similar. Always picking
 *     an explicit tier here makes the choice deliberate, not accidental.
 *
 * Note: numbers are in milliseconds, matching React Query's API.
 */
export const STALE_TIME = {
  /** 30s — data that changes as the user works (tasks, comments, notifications) */
  VOLATILE: 30_000,
  /** 1 min — lists like plans, properties, budgets, service-requests */
  MEDIUM: 60_000,
  /** 5 min — append-only or infrequently-updated: photos, expenses, health, milestones, audit logs */
  SLOW: 5 * 60_000,
} as const;
