import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getDashboardActivity } from '@/lib/api/dashboard';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => getDashboardStats().then((r) => r.data),
  });
}

export function useDashboardActivity() {
  return useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: () => getDashboardActivity().then((r) => r.data),
  });
}
