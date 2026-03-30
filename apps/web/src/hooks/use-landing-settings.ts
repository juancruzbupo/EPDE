import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getLandingSettings, updateLandingSetting } from '@/lib/api/landing-settings';

export function useLandingSettings() {
  return useQuery({
    queryKey: ['landing-settings'],
    queryFn: getLandingSettings,
  });
}

export function useUpdateLandingSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      updateLandingSetting(key, value),
    onSuccess: () => {
      toast.success('Configuración de landing actualizada');
      queryClient.invalidateQueries({ queryKey: ['landing-settings'] });
    },
    onError: () => {
      toast.error('Error al actualizar la configuración');
    },
  });
}
