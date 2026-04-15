import { QUERY_KEYS } from '@epde/shared';
import type { QueryClient } from '@tanstack/react-query';

/**
 * Invalidate every dashboard query key the web app uses (admin + client).
 *
 * Web serves both ADMIN and CLIENT roles, so both sets must be invalidated.
 * Mobile's `invalidateDashboard()` (same name) only invalidates the client
 * keys because mobile is client-only — naming matches on purpose so consumers
 * read identically across platforms.
 *
 * Parity contract (enforced by `invalidate-dashboard-parity.test.ts` in
 * shared): both helpers MUST invalidate the three client dashboard keys
 * (`dashboardClientStats`, `dashboardClientUpcoming`,
 * `dashboardClientAnalytics`). Web additionally invalidates the admin keys.
 */
export function invalidateDashboard(qc: QueryClient): void {
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardStats] });
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardActivity] });
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardAnalytics] });
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientStats] });
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientUpcoming] });
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientAnalytics] });
}
