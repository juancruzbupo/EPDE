import type { UpdateClientInput } from '@epde/shared';
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { createClient, deleteClient, reinviteClient, updateClient } from '@/lib/api/clients';
import { invalidateDashboard } from '@/lib/invalidate-dashboard';

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      toast.success('Cliente creado');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clients] });
      invalidateDashboard(queryClient);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al crear cliente'));
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & Partial<UpdateClientInput>) =>
      updateClient(id, dto),
    onSuccess: () => {
      toast.success('Cliente actualizado');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clients] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al actualizar cliente'));
    },
  });
}

export function useReinviteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reinviteClient,
    onSuccess: () => {
      toast.success('Invitación reenviada');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clients] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al reenviar invitación'));
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      toast.success('Cliente eliminado');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clients] });
      invalidateDashboard(queryClient);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al eliminar cliente'));
    },
  });
}
