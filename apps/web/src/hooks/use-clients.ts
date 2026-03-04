import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import { QUERY_KEYS } from '@epde/shared';
import type { ClientPublic } from '@epde/shared';
import { useDebounce } from './use-debounce';
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  type ClientFilters,
} from '@/lib/api/clients';

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
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al crear cliente'));
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string; name?: string; phone?: string; status?: string }) =>
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

export function useClientSearch(search: string) {
  const debouncedSearch = useDebounce(search, 300);

  return useQuery({
    queryKey: [QUERY_KEYS.clients, 'search', debouncedSearch],
    queryFn: async ({ signal }) => {
      const result = await getClients({ search: debouncedSearch || undefined, take: 20 }, signal);
      return result.data;
    },
    enabled: debouncedSearch.length > 0,
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      toast.success('Cliente eliminado');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clients] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al eliminar cliente'));
    },
  });
}
