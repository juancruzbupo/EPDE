import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import {
  getPlan,
  getPlans,
  getAllTasks,
  getTaskDetail,
  getTaskLogs,
  getTaskNotes,
  completeTask,
  addTaskNote,
} from '@/lib/api/maintenance-plans';
import type { PlanPublic, TaskNotePublic } from '@epde/shared/types';
import type { CompleteTaskInput } from '@epde/shared/schemas';
import { getErrorMessage } from '@epde/shared';
import { QUERY_KEYS } from '@/lib/query-keys';
import { useAuthStore } from '@/stores/auth-store';

export function usePlans() {
  return useQuery({
    queryKey: [QUERY_KEYS.plans, 'list'],
    queryFn: () => getPlans().then((r) => r.data),
  });
}

export function useAllTasks(status?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.plans, 'tasks', status ?? 'all'],
    queryFn: () => getAllTasks(status).then((r) => r.data),
  });
}

export function usePlan(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.plans, id],
    queryFn: ({ signal }) => getPlan(id, signal).then((r) => r.data),
    enabled: !!id,
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

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.plans, variables.planId] });

      const previousPlan = queryClient.getQueryData<PlanPublic>([
        QUERY_KEYS.plans,
        variables.planId,
      ]);

      queryClient.setQueryData<PlanPublic>([QUERY_KEYS.plans, variables.planId], (old) => {
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
      if (context?.previousPlan) {
        queryClient.setQueryData([QUERY_KEYS.plans, variables.planId], context.previousPlan);
      }
      Alert.alert('Error', getErrorMessage(_err, 'Error al completar tarea'));
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans, variables.planId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, 'client-stats'] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, 'client-upcoming'] });
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
