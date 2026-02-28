import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPlan,
  getTaskDetail,
  getTaskLogs,
  getTaskNotes,
  completeTask,
  addTaskNote,
} from '@/lib/api/maintenance-plans';
import type { PlanPublic, TaskNotePublic } from '@epde/shared/types';
import type { CompleteTaskInput } from '@epde/shared/schemas';
import { useAuthStore } from '@/stores/auth-store';

export function usePlan(id: string) {
  return useQuery({
    queryKey: ['plans', id],
    queryFn: ({ signal }) => getPlan(id, signal).then((r) => r.data),
    enabled: !!id,
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
    } & CompleteTaskInput) => completeTask(planId, taskId, dto),

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
      if (context?.previousPlan) {
        queryClient.setQueryData(['plans', variables.planId], context.previousPlan);
      }
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plans', variables.planId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'client-stats'] });
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
