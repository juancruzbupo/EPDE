import { useQuery } from '@tanstack/react-query';
import { getClientDashboardStats, getClientUpcomingTasks } from '@/lib/api/dashboard';

export function useClientDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'client-stats'],
    queryFn: () => getClientDashboardStats().then((r) => r.data),
  });
}

export function useClientUpcomingTasks() {
  return useQuery({
    queryKey: ['dashboard', 'client-upcoming'],
    queryFn: () => getClientUpcomingTasks().then((r) => r.data),
  });
}
