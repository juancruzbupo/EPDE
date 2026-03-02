import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import { QUERY_KEYS, type ClientPublic } from '@epde/shared';
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clients] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clients] }),
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al actualizar cliente'));
    },
  });
}

export function useClientSearch(search: string) {
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clients] }),
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al eliminar cliente'));
    },
  });
}
