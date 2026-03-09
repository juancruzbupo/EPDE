import { QUERY_KEYS } from '@epde/shared';
import type { QueryClient } from '@tanstack/react-query';

/**
 * Invalidates all dashboard query keys (admin + client).
 * Web serves both ADMIN and CLIENT roles, so both sets must be invalidated.
 * Compare: mobile's invalidateClientDashboard() only invalidates client keys
 * because mobile is client-only.
 */
export function invalidateDashboard(qc: QueryClient): void {
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardStats] });
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardActivity] });
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientStats] });
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientUpcoming] });
}
