import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPlan,
  updatePlan,
  addTask,
  updateTask,
  removeTask,
  reorderTasks,
} from '@/lib/api/maintenance-plans';

export function usePlan(id: string) {
  return useQuery({
    queryKey: ['plans', id],
    queryFn: () => getPlan(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string; name?: string; status?: string }) =>
      updatePlan(id, dto),
    onSuccess: (_data, vars) => queryClient.invalidateQueries({ queryKey: ['plans', vars.id] }),
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
      priority?: string;
      recurrenceType?: string;
      recurrenceMonths?: number;
      nextDueDate: string;
    }) => addTask(planId, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      planId,
      taskId,
      ...dto
    }: {
      planId: string;
      taskId: string;
    } & Record<string, unknown>) => updateTask(planId, taskId, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  });
}

export function useRemoveTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, taskId }: { planId: string; taskId: string }) =>
      removeTask(planId, taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  });
}

export function useReorderTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, tasks }: { planId: string; tasks: { id: string; order: number }[] }) =>
      reorderTasks(planId, tasks),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  });
}
