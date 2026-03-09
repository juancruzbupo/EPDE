import { QUERY_KEYS } from '@epde/shared';
import type { QueryClient } from '@tanstack/react-query';

/** Mobile is client-only — only invalidate client dashboard keys */
export function invalidateClientDashboard(qc: QueryClient): void {
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientStats] });
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientUpcoming] });
}
