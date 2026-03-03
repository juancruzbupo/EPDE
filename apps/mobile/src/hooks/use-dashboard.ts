import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { getClientDashboardStats, getClientUpcomingTasks } from '@/lib/api/dashboard';

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
