import { QUERY_KEYS } from '@epde/shared';
import type { QueryClient } from '@tanstack/react-query';

/**
 * Invalidate every dashboard query key the mobile app uses.
 *
 * Mobile is client-only — the admin dashboard surfaces (`dashboardStats`,
 * `dashboardActivity`, `dashboardAnalytics`) only exist in web. The
 * naming matches `apps/web/src/lib/invalidate-dashboard.ts` on purpose so
 * consumers read identically across platforms; the difference is in the
 * implementation, not the call site.
 *
 * Parity contract (enforced by `invalidate-dashboard-parity.test.ts` in
 * shared): both helpers MUST invalidate the three client dashboard keys
 * (`dashboardClientStats`, `dashboardClientUpcoming`,
 * `dashboardClientAnalytics`). Web additionally invalidates the admin keys.
 */
export function invalidateDashboard(qc: QueryClient): void {
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientStats] });
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientUpcoming] });
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientAnalytics] });
}
