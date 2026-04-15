/**
 * Mobile maintenance plan hooks.
 * Web equivalent: apps/web/src/hooks/use-plans.ts
 *
 * Includes plan status mutations (activate/archive) because mobile admin
 * uses them via the property detail screen.
 * Plan creation/deletion are admin-web-only and omitted here.
 *
 * If the plan or task API response shape changes, update BOTH this file and the web hook.
 */
import type { PlanStatus, TaskStatus } from '@epde/shared';
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { STALE_TIME } from '@epde/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getAllTasks, getPlan, getPlans, updatePlan } from '@/lib/api/maintenance-plans';
import { haptics } from '@/lib/haptics';
import { invalidateDashboard } from '@/lib/invalidate-dashboard';
import { toast } from '@/lib/toast';

export function usePlans() {
  return useQuery({
    queryKey: [QUERY_KEYS.plans, QUERY_KEYS.plansList],
    queryFn: ({ signal }) => getPlans(signal).then((r) => r.data),
    staleTime: STALE_TIME.MEDIUM,
  });
}

export function useAllTasks(params?: { status?: TaskStatus; propertyId?: string }) {
  return useQuery({
    queryKey: [
      QUERY_KEYS.plans,
      QUERY_KEYS.plansTasks,
      params?.status ?? 'all',
      params?.propertyId ?? 'all',
    ],
    queryFn: ({ signal }) => getAllTasks(params, signal).then((r) => r.data),
    staleTime: STALE_TIME.VOLATILE,
  });
}

export function usePlan(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.plans, id],
    queryFn: ({ signal }) => getPlan(id, signal).then((r) => r.data),
    enabled: !!id,
    staleTime: STALE_TIME.MEDIUM,
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string; status?: PlanStatus }) => updatePlan(id, dto),
    onSuccess: () => {
      haptics.success();
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.properties] });
      invalidateDashboard(queryClient);
      toast.success('Plan actualizado');
    },
    onError: (err) => {
      haptics.error();
      toast.error(getErrorMessage(err, 'Error al actualizar plan'));
    },
  });
}
