import type {
  CompleteTaskInput,
  ProfessionalRequirement,
  RecurrenceType,
  TaskPriority,
  TaskType,
} from '@epde/shared';
import {
  COMPLETION_MESSAGES,
  getErrorMessage,
  PREVENTION_SAVINGS,
  QUERY_KEYS,
  TaskStatus,
} from '@epde/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { TaskNotePublic } from '@/lib/api/maintenance-plans';
import {
  addTaskNote,
  bulkAddTasksFromTemplate,
  completeTask,
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

/** Completes a task and shows rescheduling feedback.
 *  No optimistic status change — the server resets status to PENDING with a new nextDueDate
 *  (preventive maintenance model: tasks are cyclic, completion = reschedule). */
export function useCompleteTask(options?: {
  onProblemDetected?: (info: { taskId: string; taskName: string }) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      taskId,
      ...dto
    }: {
      planId: string;
      taskId: string;
      taskName?: string;
    } & CompleteTaskInput) => completeTask(planId, taskId, dto),

    onSuccess: (response, variables) => {
      // F1: Motivational toast with rotating messages
      const msg = COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)];
      const nextDueDate = response.data?.task?.nextDueDate;
      if (nextDueDate) {
        const formatted = new Date(nextDueDate).toLocaleDateString('es-AR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        toast.success(`${msg} Próxima: ${formatted}`);
      } else {
        toast.success(msg);
      }

      // F6: "Evitaste un problema" — show savings when problem detected early
      if (response.data?.problemDetected) {
        const categoryName = response.data.task?.category?.name;
        const savings = categoryName ? PREVENTION_SAVINGS[categoryName] : undefined;
        if (savings) {
          setTimeout(() => {
            toast.info(
              `Detectaste un problema a tiempo. Sin prevención, podría costarte ${savings}.`,
              { duration: 6000 },
            );
          }, 1500);
        }

        options?.onProblemDetected?.({
          taskId: variables.taskId,
          taskName: variables.taskName ?? response.data.task?.name ?? 'Tarea',
        });
      }
    },

    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al completar tarea'));
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans, variables.planId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.properties] });
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

export function useBulkAddTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, categoryTemplateId }: { planId: string; categoryTemplateId: string }) =>
      bulkAddTasksFromTemplate(planId, categoryTemplateId),
    onSuccess: (response) => {
      const count = response.data?.count ?? 0;
      if (count === 0) {
        toast.info('No se agregaron tareas — ya existían en el plan.');
      } else {
        toast.success(`${count} tarea${count !== 1 ? 's' : ''} agregada${count !== 1 ? 's' : ''}`);
      }
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans] });
      invalidateDashboard(queryClient);
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al aplicar template')),
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
