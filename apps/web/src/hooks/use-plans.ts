import type {
  PlanStatus,
  ProfessionalRequirement,
  RecurrenceType,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '@epde/shared';
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { addTask, getAllTasks, getPlan, getPlans, updatePlan } from '@/lib/api/maintenance-plans';
import { invalidateDashboard } from '@/lib/invalidate-dashboard';

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
    mutationFn: ({ id, ...dto }: { id: string; name?: string; status?: PlanStatus }) =>
      updatePlan(id, dto),
    onSuccess: (_data, vars) => {
      toast.success('Plan actualizado');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans, vars.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans, QUERY_KEYS.plansList] });
      invalidateDashboard(queryClient);
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al actualizar plan')),
  });
}

export function useAddTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      planId,
      ...dto
    }: {
      planId: string;
      categoryId: string;
      name: string;
      description?: string;
      priority?: TaskPriority;
      recurrenceType?: RecurrenceType;
      recurrenceMonths?: number;
      nextDueDate?: string;
      taskType?: TaskType;
      professionalRequirement?: ProfessionalRequirement;
      technicalDescription?: string;
      estimatedDurationMinutes?: number;
    }) => addTask(planId, dto),
    onSuccess: () => {
      toast.success('Tarea agregada');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans] });
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al agregar tarea')),
  });
}
