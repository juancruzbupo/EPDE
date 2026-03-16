import { QUERY_KEYS } from '@epde/shared';
import { useQuery } from '@tanstack/react-query';

import {
  getAdminAnalytics,
  getClientAnalytics,
  getClientDashboardStats,
  getClientUpcomingTasks,
  getDashboardActivity,
  getDashboardStats,
} from '@/lib/api/dashboard';

export function useClientDashboardStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientStats],
    queryFn: ({ signal }) => getClientDashboardStats(signal).then((r) => r.data),
  });
}

export function useClientUpcomingTasks() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientUpcoming],
    queryFn: ({ signal }) => getClientUpcomingTasks(signal).then((r) => r.data),
  });
}

export function useClientAnalytics(months?: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientAnalytics, months],
    queryFn: ({ signal }) => getClientAnalytics(signal, months).then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}

// ─── Admin hooks ────────────────────────────────────────

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardStats],
    queryFn: ({ signal }) => getDashboardStats(signal).then((r) => r.data),
  });
}

export function useAdminActivity() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardActivity],
    queryFn: ({ signal }) => getDashboardActivity(signal).then((r) => r.data),
  });
}

export function useAdminAnalytics(months?: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardAnalytics, months],
    queryFn: ({ signal }) => getAdminAnalytics(signal, months).then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}
