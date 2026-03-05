import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@epde/shared';
import { getClientDashboardStats, getClientUpcomingTasks } from '@/lib/api/dashboard';

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
