import { useQuery } from '@tanstack/react-query';
import { getPlan, getPlans, getAllTasks } from '@/lib/api/maintenance-plans';
import { QUERY_KEYS } from '@epde/shared';

export function usePlans() {
  return useQuery({
    queryKey: [QUERY_KEYS.plans, 'list'],
    queryFn: ({ signal }) => getPlans(signal).then((r) => r.data),
  });
}

export function useAllTasks(status?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.plans, 'tasks', status ?? 'all'],
    queryFn: ({ signal }) => getAllTasks(status, signal).then((r) => r.data),
  });
}

export function usePlan(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.plans, id],
    queryFn: ({ signal }) => getPlan(id, signal).then((r) => r.data),
    enabled: !!id,
  });
}
