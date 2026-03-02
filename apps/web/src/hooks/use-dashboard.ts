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
    queryKey: [QUERY_KEYS.dashboard, 'stats'],
    queryFn: ({ signal }) => getDashboardStats(signal).then((r) => r.data),
  });
}

export function useDashboardActivity() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, 'activity'],
    queryFn: ({ signal }) => getDashboardActivity(signal).then((r) => r.data),
  });
}

export function useClientDashboardStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, 'client-stats'],
    queryFn: ({ signal }) => getClientDashboardStats(signal).then((r) => r.data),
  });
}

export function useClientUpcomingTasks() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, 'client-upcoming'],
    queryFn: ({ signal }) => getClientUpcomingTasks(signal).then((r) => r.data),
  });
}
