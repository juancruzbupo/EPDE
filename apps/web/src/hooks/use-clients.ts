import type { ClientPublic, UserStatus } from '@epde/shared';
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  type ClientFilters,
  createClient,
  deleteClient,
  getClient,
  getClients,
  reinviteClient,
  updateClient,
} from '@/lib/api/clients';
import { invalidateDashboard } from '@/lib/invalidate-dashboard';

import { useDebounce } from './use-debounce';

export function useClients(filters: ClientFilters) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.clients, filters],
    queryFn: ({ pageParam, signal }) => getClients({ ...filters, cursor: pageParam }, signal),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    maxPages: 10,
  });
}

export function useClient(id: string, options?: { initialData?: ClientPublic }) {
  return useQuery({
    queryKey: [QUERY_KEYS.clients, id],
    queryFn: ({ signal }) => getClient(id, signal).then((r) => r.data),
    initialData: options?.initialData,
    enabled: !!id,
  });
}

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
    mutationFn: ({
      id,
      ...dto
    }: {
      id: string;
      name?: string;
      phone?: string;
      status?: UserStatus;
    }) => updateClient(id, dto),
    onSuccess: () => {
      toast.success('Cliente actualizado');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clients] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al actualizar cliente'));
    },
  });
}

export function useClientSearch(search: string) {
  const debouncedSearch = useDebounce(search, 300);

  return useQuery({
    queryKey: [QUERY_KEYS.clients, QUERY_KEYS.clientsSearch, debouncedSearch],
    queryFn: async ({ signal }) => {
      const result = await getClients({ search: debouncedSearch || undefined, take: 20 }, signal);
      return result.data;
    },
    enabled: debouncedSearch.length > 0,
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
