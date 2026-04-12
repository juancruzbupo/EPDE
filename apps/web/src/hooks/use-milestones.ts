import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { activateStreakFreeze, getMilestones } from '@/lib/api/auth-features';
import { invalidateDashboard } from '@/lib/invalidate-dashboard';

export function useMilestones() {
  return useQuery({
    queryKey: [QUERY_KEYS.milestones ?? 'milestones'],
    queryFn: ({ signal }) => getMilestones(signal).then((r) => r.data),
  });
}

export function useStreakFreeze() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateStreakFreeze,
    onSuccess: () => {
      toast.success('❄️ Streak freeze activado. Tu racha está protegida este mes.');
      invalidateDashboard(queryClient);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'No se pudo activar el freeze'));
    },
  });
}
