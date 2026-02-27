import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import {
  getPlan,
  updatePlan,
  addTask,
  updateTask,
  removeTask,
  reorderTasks,
  getTaskDetail,
  completeTask,
  getTaskLogs,
  getTaskNotes,
  addTaskNote,
} from '@/lib/api/maintenance-plans';
import type { PlanPublic, TaskNotePublic } from '@/lib/api/maintenance-plans';
import { useAuthStore } from '@/stores/auth-store';

export function usePlan(id: string) {
  return useQuery({
    queryKey: ['plans', id],
    queryFn: ({ signal }) => getPlan(id, signal).then((r) => r.data),
    enabled: !!id,
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string; name?: string; status?: string }) =>
      updatePlan(id, dto),
    onSuccess: (_data, vars) => queryClient.invalidateQueries({ queryKey: ['plans', vars.id] }),
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
      priority?: string;
      recurrenceType?: string;
      recurrenceMonths?: number;
      nextDueDate: string;
    }) => addTask(planId, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
    onError: (err) => toast.error(getErrorMessage(err, 'Error al agregar tarea')),
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
    onError: (err) => toast.error(getErrorMessage(err, 'Error al actualizar tarea')),
  });
}

export function useRemoveTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, taskId }: { planId: string; taskId: string }) =>
      removeTask(planId, taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
    onError: (err) => toast.error(getErrorMessage(err, 'Error al eliminar tarea')),
  });
}

export function useReorderTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, tasks }: { planId: string; tasks: { id: string; order: number }[] }) =>
      reorderTasks(planId, tasks),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
    onError: (err) => toast.error(getErrorMessage(err, 'Error al reordenar tareas')),
  });
}

export function useTaskDetail(planId: string, taskId: string) {
  return useQuery({
    queryKey: ['task-detail', planId, taskId],
    queryFn: ({ signal }) => getTaskDetail(planId, taskId, signal).then((r) => r.data),
    enabled: !!planId && !!taskId,
  });
}

export function useTaskLogs(planId: string, taskId: string) {
  return useQuery({
    queryKey: ['task-logs', planId, taskId],
    queryFn: ({ signal }) => getTaskLogs(planId, taskId, signal).then((r) => r.data),
    enabled: !!planId && !!taskId,
  });
}

export function useTaskNotes(planId: string, taskId: string) {
  return useQuery({
    queryKey: ['task-notes', planId, taskId],
    queryFn: ({ signal }) => getTaskNotes(planId, taskId, signal).then((r) => r.data),
    enabled: !!planId && !!taskId,
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      taskId,
      ...dto
    }: {
      planId: string;
      taskId: string;
      notes?: string;
      photoUrl?: string;
    }) => completeTask(planId, taskId, dto),

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['plans', variables.planId] });

      const previousPlan = queryClient.getQueryData<PlanPublic>(['plans', variables.planId]);

      queryClient.setQueryData<PlanPublic>(['plans', variables.planId], (old) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((t) =>
            t.id === variables.taskId ? { ...t, status: 'COMPLETED' } : t,
          ),
        };
      });

      return { previousPlan };
    },

    onError: (_err, variables, context) => {
      toast.error(getErrorMessage(_err, 'Error al completar tarea'));
      if (context?.previousPlan) {
        queryClient.setQueryData(['plans', variables.planId], context.previousPlan);
      }
    },

    onSettled: (_data, error, variables) => {
      if (!error) toast.success('Tarea completada');
      queryClient.invalidateQueries({ queryKey: ['plans', variables.planId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'activity'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'client-upcoming'] });
      queryClient.invalidateQueries({
        queryKey: ['task-logs', variables.planId, variables.taskId],
      });
      queryClient.invalidateQueries({
        queryKey: ['task-detail', variables.planId, variables.taskId],
      });
    },
  });
}

export function useAddTaskNote() {
  const queryClient = useQueryClient();
  const user = useAuthStore.getState().user;

  return useMutation({
    mutationFn: ({
      planId,
      taskId,
      content,
    }: {
      planId: string;
      taskId: string;
      content: string;
    }) => addTaskNote(planId, taskId, { content }),

    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: ['task-notes', variables.planId, variables.taskId],
      });

      const previousNotes = queryClient.getQueryData<TaskNotePublic[]>([
        'task-notes',
        variables.planId,
        variables.taskId,
      ]);

      queryClient.setQueryData<TaskNotePublic[]>(
        ['task-notes', variables.planId, variables.taskId],
        (old) => [
          {
            id: `temp-${Date.now()}`,
            taskId: variables.taskId,
            content: variables.content,
            createdAt: new Date().toISOString(),
            author: { id: user?.id ?? '', name: user?.name ?? '' },
          },
          ...(old ?? []),
        ],
      );

      return { previousNotes };
    },

    onError: (_err, variables, context) => {
      toast.error(getErrorMessage(_err, 'Error al agregar nota'));
      if (context?.previousNotes) {
        queryClient.setQueryData(
          ['task-notes', variables.planId, variables.taskId],
          context.previousNotes,
        );
      }
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['task-notes', variables.planId, variables.taskId],
      });
      queryClient.invalidateQueries({
        queryKey: ['task-detail', variables.planId, variables.taskId],
      });
    },
  });
}
