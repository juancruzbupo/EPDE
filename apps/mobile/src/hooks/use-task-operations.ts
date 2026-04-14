/**
 * Mobile task operation hooks.
 * Web equivalent: apps/web/src/hooks/use-task-operations.ts + use-task-operations-mutations.ts
 *
 * Includes complete-task and note mutations (available to all users).
 * Admin-only operations (create/edit/delete task, reorder, bulk-create) are web-only.
 *
 * If the task completion or note API response shape changes, update BOTH this file and the web hooks.
 */
import type { CompleteTaskInput, TaskNotePublic } from '@epde/shared';
import { COMPLETION_MESSAGES, getErrorMessage, PREVENTION_SAVINGS, QUERY_KEYS } from '@epde/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

import {
  addTaskNote,
  completeTask,
  getTaskDetail,
  getTaskLogs,
  getTaskNotes,
} from '@/lib/api/maintenance-plans';
import { confettiEvent } from '@/lib/confetti-event';
import { haptics } from '@/lib/haptics';
import { invalidateClientDashboard } from '@/lib/invalidate-dashboard';
import { useAuthStore } from '@/stores/auth-store';

import { STALE_TIME } from './query-stale-times';

export function useTaskDetail(planId: string, taskId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.taskDetail, planId, taskId],
    queryFn: ({ signal }) => getTaskDetail(planId, taskId, signal).then((r) => r.data),
    enabled: !!planId && !!taskId,
    staleTime: STALE_TIME.VOLATILE,
  });
}

export function useTaskLogs(planId: string, taskId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.taskLogs, planId, taskId],
    queryFn: ({ signal }) => getTaskLogs(planId, taskId, signal).then((r) => r.data),
    enabled: !!planId && !!taskId,
    staleTime: STALE_TIME.MEDIUM,
  });
}

export function useTaskNotes(planId: string, taskId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.taskNotes, planId, taskId],
    queryFn: ({ signal }) => getTaskNotes(planId, taskId, signal).then((r) => r.data),
    enabled: !!planId && !!taskId,
    staleTime: STALE_TIME.MEDIUM,
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
      haptics.success();
      confettiEvent.fire();
      const msg = COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)];
      const nextDueDate = response.data?.task?.nextDueDate;
      if (nextDueDate) {
        const formatted = new Date(nextDueDate).toLocaleDateString('es-AR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        Alert.alert(msg, `Próxima: ${formatted}`);
      } else {
        Alert.alert('Tarea completada', msg);
      }

      // F6: "Evitaste un problema" — show savings
      if (response.data?.problemDetected) {
        const categoryName = response.data.task?.category?.name;
        const savings = categoryName ? PREVENTION_SAVINGS[categoryName] : undefined;
        if (savings) {
          setTimeout(() => {
            Alert.alert(
              'Detectaste un problema a tiempo',
              `Sin prevención, esto podría costarte ${savings}.`,
            );
          }, 2000);
        }

        options?.onProblemDetected?.({
          taskId: variables.taskId,
          taskName: variables.taskName ?? response.data.task?.name ?? 'Tarea',
        });
      }
    },

    onError: (err) => {
      haptics.error();
      Alert.alert('Error', getErrorMessage(err, 'Error al completar tarea'));
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans, variables.planId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.properties] });
      invalidateClientDashboard(queryClient);
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

    onSuccess: () => {
      haptics.success();
    },

    onError: (_err, variables, context) => {
      haptics.error();
      if (context?.previousNotes) {
        queryClient.setQueryData(
          [QUERY_KEYS.taskNotes, variables.planId, variables.taskId],
          context.previousNotes,
        );
      }
      Alert.alert('Error', getErrorMessage(_err, 'Error al agregar nota'));
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
