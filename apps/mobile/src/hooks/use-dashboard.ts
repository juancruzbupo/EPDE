/**
 * Mobile dashboard hooks — read-only (client view only).
 * Web equivalent: apps/web/src/hooks/use-dashboard.ts
 *
 * Only client dashboard endpoints are used (stats, upcoming tasks, analytics).
 * Admin dashboard endpoints (admin stats, activity feed, admin analytics) are web-only.
 *
 * If the dashboard API response shape changes, update BOTH this file and the web hook.
 */
import { QUERY_KEYS } from '@epde/shared';
import { useQuery } from '@tanstack/react-query';

import {
  getClientAnalytics,
  getClientDashboardStats,
  getClientUpcomingTasks,
} from '@/lib/api/dashboard';

import { STALE_TIME } from './query-stale-times';

export function useClientDashboardStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientStats],
    queryFn: ({ signal }) => getClientDashboardStats(signal).then((r) => r.data),
    staleTime: STALE_TIME.MEDIUM,
  });
}

export function useClientUpcomingTasks() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientUpcoming],
    queryFn: ({ signal }) => getClientUpcomingTasks(signal).then((r) => r.data),
    staleTime: STALE_TIME.VOLATILE,
  });
}

export function useClientAnalytics(months?: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientAnalytics, months],
    queryFn: ({ signal }) => getClientAnalytics(signal, months).then((r) => r.data),
    staleTime: STALE_TIME.SLOW,
    enabled: months != null,
  });
}
