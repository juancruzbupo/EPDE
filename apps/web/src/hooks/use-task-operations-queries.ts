import { QUERY_KEYS } from '@epde/shared';
import { STALE_TIME } from '@epde/shared';
import { useQuery } from '@tanstack/react-query';

import { getTaskDetail, getTaskLogs, getTaskNotes } from '@/lib/api/maintenance-plans';

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
