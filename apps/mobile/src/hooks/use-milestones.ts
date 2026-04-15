/**
 * Mobile milestone hooks.
 * Web equivalent: apps/web/src/hooks/use-milestones.ts
 *
 * Includes streak-freeze mutation (client action). Milestone awarding is
 * server-side only (triggered by cron and task completion).
 *
 * If the milestones API response shape changes, update BOTH this file and the web hook.
 */
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { STALE_TIME } from '@epde/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { activateStreakFreeze, getMilestones } from '@/lib/api/auth-features';
import { haptics } from '@/lib/haptics';
import { invalidateDashboard } from '@/lib/invalidate-dashboard';
import { toast } from '@/lib/toast';

export function useMilestones() {
  return useQuery({
    queryKey: [QUERY_KEYS.milestones ?? 'milestones'],
    queryFn: ({ signal }) => getMilestones(signal).then((r) => r.data),
    staleTime: STALE_TIME.SLOW,
  });
}

export function useStreakFreeze() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateStreakFreeze,
    onSuccess: () => {
      haptics.success();
      toast.success('❄️ Freeze activado — tu racha está protegida este mes.', 4500);
      invalidateDashboard(queryClient);
    },
    onError: (err) => {
      haptics.error();
      toast.error(getErrorMessage(err, 'No se pudo activar el freeze'));
    },
  });
}
