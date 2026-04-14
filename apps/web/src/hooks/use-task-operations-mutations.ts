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
  UserRole,
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
import { triggerConfetti } from '@/lib/confetti';
import { invalidateDashboard } from '@/lib/invalidate-dashboard';
import { useAuthStore } from '@/stores/auth-store';
import { useUiPreferencesStore } from '@/stores/ui-preferences-store';

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
    onSuccess: (_data, variables) => {
      toast.success('Tarea actualizada');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans, variables.planId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans, QUERY_KEYS.plansTasks] });
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
    onSuccess: (_data, variables) => {
      toast.success('Tarea eliminada');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans, variables.planId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans, QUERY_KEYS.plansTasks] });
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
    onSuccess: (_data, variables) => {
      toast.success('Orden actualizado');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans, variables.planId] });
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
      const isClient = useAuthStore.getState().user?.role === UserRole.CLIENT;
      const wantsRewards = useUiPreferencesStore.getState().motivationStyle === 'rewards';
      const showMotivation = isClient && wantsRewards;
      const nextDueDate = response.data?.task?.nextDueDate;
      const formattedDate = nextDueDate
        ? new Date(nextDueDate).toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : null;

      if (showMotivation) {
        // Motivational flow: confetti + random completion message + savings toast
        triggerConfetti();
        const msg = COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)];
        toast.success(formattedDate ? `${msg} Próxima: ${formattedDate}` : msg);
      } else {
        // Admin or client in 'minimal' motivation style — neutral confirmation.
        toast.success(
          formattedDate ? `Tarea completada. Próxima: ${formattedDate}` : 'Tarea completada',
        );
      }

      if (response.data?.problemDetected) {
        if (showMotivation) {
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
        }
        // The follow-up dialog fires regardless — it's functional, not motivational.
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans, QUERY_KEYS.plansTasks] });
      // Property-level queries (health index, problems) can change after completion.
      // We don't know propertyId here without a lookup, so keep the broader invalidation
      // but note this as a future optimization if property detail becomes chatty.
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.properties] });
      invalidateDashboard(queryClient);
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.taskLogs, variables.planId, variables.taskId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.taskDetail, variables.planId, variables.taskId],
      });
      // Milestones — backend checkAndAward completes in <50ms (fire-and-forget createMany).
      // By the time the HTTP round-trip returns, badges are already persisted.
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.milestones] });
    },
  });
}

export function useBulkAddTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, categoryTemplateId }: { planId: string; categoryTemplateId: string }) =>
      bulkAddTasksFromTemplate(planId, categoryTemplateId),
    onSuccess: (response, variables) => {
      const count = response.data?.count ?? 0;
      if (count === 0) {
        toast.info('No se agregaron tareas — ya existían en el plan.');
      } else {
        toast.success(`${count} tarea${count !== 1 ? 's' : ''} agregada${count !== 1 ? 's' : ''}`);
      }
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans, variables.planId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans, QUERY_KEYS.plansTasks] });
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

    onSuccess: () => {
      toast.success('Nota agregada');
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
