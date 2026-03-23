import type { PlanStatus, TaskStatus } from '@epde/shared';
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

import { getAllTasks, getPlan, getPlans, updatePlan } from '@/lib/api/maintenance-plans';

export function usePlans() {
  return useQuery({
    queryKey: [QUERY_KEYS.plans, QUERY_KEYS.plansList],
    queryFn: ({ signal }) => getPlans(signal).then((r) => r.data),
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
  });
}

export function usePlan(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.plans, id],
    queryFn: ({ signal }) => getPlan(id, signal).then((r) => r.data),
    enabled: !!id,
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string; status?: PlanStatus }) => updatePlan(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.properties] });
      Alert.alert('Éxito', 'Plan actualizado');
    },
    onError: (err) => {
      Alert.alert('Error', getErrorMessage(err, 'Error al actualizar plan'));
    },
  });
}
