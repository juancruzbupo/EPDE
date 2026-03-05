import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@epde/shared';
import {
  getDashboardStats,
  getDashboardActivity,
  getClientDashboardStats,
  getClientUpcomingTasks,
} from '@/lib/api/dashboard';

export function useDashboardStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardStats],
    queryFn: ({ signal }) => getDashboardStats(signal).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });
}

export function useDashboardActivity() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardActivity],
    queryFn: ({ signal }) => getDashboardActivity(signal).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });
}

export function useClientDashboardStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientStats],
    queryFn: ({ signal }) => getClientDashboardStats(signal).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });
}

export function useClientUpcomingTasks() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientUpcoming],
    queryFn: ({ signal }) => getClientUpcomingTasks(signal).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });
}
