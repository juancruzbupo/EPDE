import { QUERY_KEYS } from '@epde/shared';
import type { QueryClient } from '@tanstack/react-query';

/**
 * Invalidate client-only dashboard keys (stats + upcoming tasks + analytics).
 *
 * Mobile is client-only, so only CLIENT dashboard queries exist here.
 * Web's `invalidateDashboard()` invalidates both admin + client keys
 * because the web app serves both roles from a single dashboard.
 */
export function invalidateClientDashboard(qc: QueryClient): void {
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientStats] });
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientUpcoming] });
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientAnalytics] });
}
