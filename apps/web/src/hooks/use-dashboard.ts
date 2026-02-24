import { useQuery } from '@tanstack/react-query';
import {
  getDashboardStats,
  getDashboardActivity,
  getClientDashboardStats,
  getClientUpcomingTasks,
} from '@/lib/api/dashboard';

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
