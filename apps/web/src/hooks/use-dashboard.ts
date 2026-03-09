import { QUERY_KEYS } from '@epde/shared';
import { useQuery } from '@tanstack/react-query';

import {
  getClientDashboardStats,
  getClientUpcomingTasks,
  getDashboardActivity,
  getDashboardStats,
} from '@/lib/api/dashboard';

export function useDashboardStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardStats],
    queryFn: ({ signal }) => getDashboardStats(signal).then((r) => r.data),
  });
}

export function useDashboardActivity() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardActivity],
    queryFn: ({ signal }) => getDashboardActivity(signal).then((r) => r.data),
  });
}

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
