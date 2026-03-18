import type {
  CompleteTaskInput,
  ProfessionalRequirement,
  RecurrenceType,
  TaskPriority,
  TaskType,
} from '@epde/shared';
import { getErrorMessage, QUERY_KEYS, TaskStatus } from '@epde/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { TaskNotePublic } from '@/lib/api/maintenance-plans';
import {
  addTaskNote,
  completeTask,
  getTaskDetail,
  getTaskLogs,
  getTaskNotes,
  removeTask,
  reorderTasks,
  updateTask,
} from '@/lib/api/maintenance-plans';
import { invalidateDashboard } from '@/lib/invalidate-dashboard';
import { useAuthStore } from '@/stores/auth-store';

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
      categoryId?: string;
      name?: string;
      description?: string;
      priority?: TaskPriority;
      recurrenceType?: RecurrenceType;
      recurrenceMonths?: number;
      nextDueDate?: string;
      status?: TaskStatus;
      taskType?: TaskType;
      professionalRequirement?: ProfessionalRequirement;
      technicalDescription?: string | null;
      estimatedDurationMinutes?: number | null;
    }) => updateTask(planId, taskId, dto),
    onSuccess: () => {
      toast.success('Tarea actualizada');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans] });
      invalidateDashboard(queryClient);
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al actualizar tarea')),
  });
}

export function useRemoveTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, taskId }: { planId: string; taskId: string }) =>
      removeTask(planId, taskId),
    onSuccess: () => {
      toast.success('Tarea eliminada');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans] });
      invalidateDashboard(queryClient);
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al eliminar tarea')),
  });
}

export function useReorderTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, tasks }: { planId: string; tasks: { id: string; order: number }[] }) =>
      reorderTasks(planId, tasks),
    onSuccess: () => {
      toast.success('Orden actualizado');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans] });
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al reordenar tareas')),
  });
}

export function useTaskDetail(planId: string, taskId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.taskDetail, planId, taskId],
    queryFn: ({ signal }) => getTaskDetail(planId, taskId, signal).then((r) => r.data),
    enabled: !!planId && !!taskId,
  });
}

export function useTaskLogs(planId: string, taskId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.taskLogs, planId, taskId],
    queryFn: ({ signal }) => getTaskLogs(planId, taskId, signal).then((r) => r.data),
    enabled: !!planId && !!taskId,
  });
}

export function useTaskNotes(planId: string, taskId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.taskNotes, planId, taskId],
    queryFn: ({ signal }) => getTaskNotes(planId, taskId, signal).then((r) => r.data),
    enabled: !!planId && !!taskId,
  });
}

/** Completes a task and shows rescheduling feedback.
 *  No optimistic status change — the server resets status to PENDING with a new nextDueDate
 *  (preventive maintenance model: tasks are cyclic, completion = reschedule). */
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
    } & CompleteTaskInput) => completeTask(planId, taskId, dto),

    onSuccess: (response) => {
      const nextDueDate = (response as { data?: { task?: { nextDueDate?: string } } })?.data?.task
        ?.nextDueDate;
      if (nextDueDate) {
        const formatted = new Date(nextDueDate).toLocaleDateString('es-AR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        toast.success(`Tarea completada. Próxima: ${formatted}`);
      } else {
        toast.success('Tarea completada');
      }
    },

    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al completar tarea'));
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans, variables.planId] });
      invalidateDashboard(queryClient);
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.taskLogs, variables.planId, variables.taskId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.taskDetail, variables.planId, variables.taskId],
      });
    },
  });
}

export function useAddTaskNote() {
  const queryClient = useQueryClient();

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
      const user = useAuthStore.getState().user;

      await queryClient.cancelQueries({
        queryKey: [QUERY_KEYS.taskNotes, variables.planId, variables.taskId],
      });

      const previousNotes = queryClient.getQueryData<TaskNotePublic[]>([
        QUERY_KEYS.taskNotes,
        variables.planId,
        variables.taskId,
      ]);

      queryClient.setQueryData<TaskNotePublic[]>(
        [QUERY_KEYS.taskNotes, variables.planId, variables.taskId],
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
          [QUERY_KEYS.taskNotes, variables.planId, variables.taskId],
          context.previousNotes,
        );
      }
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.taskNotes, variables.planId, variables.taskId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.taskDetail, variables.planId, variables.taskId],
      });
    },
  });
}
