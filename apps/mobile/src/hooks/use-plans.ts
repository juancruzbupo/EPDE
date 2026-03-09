// Client-only query hooks — plan mutations (update, add task, reorder)
// are admin-only and live in apps/web/src/hooks/use-plans.ts.
import type { TaskStatus } from '@epde/shared';
import { QUERY_KEYS } from '@epde/shared';
import { useQuery } from '@tanstack/react-query';

import { getAllTasks, getPlan, getPlans } from '@/lib/api/maintenance-plans';

export function usePlans() {
  return useQuery({
    queryKey: [QUERY_KEYS.plans, 'list'],
    queryFn: ({ signal }) => getPlans(signal).then((r) => r.data),
  });
}

export function useAllTasks(status?: TaskStatus) {
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
