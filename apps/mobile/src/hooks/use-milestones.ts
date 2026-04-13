import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

import { activateStreakFreeze, getMilestones } from '@/lib/api/auth-features';
import { haptics } from '@/lib/haptics';
import { invalidateClientDashboard } from '@/lib/invalidate-dashboard';

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
      haptics.success();
      Alert.alert('❄️ Freeze activado', 'Tu racha está protegida este mes.');
      invalidateClientDashboard(queryClient);
    },
    onError: (err) => {
      haptics.error();
      Alert.alert('Error', getErrorMessage(err, 'No se pudo activar el freeze'));
    },
  });
}
