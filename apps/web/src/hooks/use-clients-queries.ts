import type { ClientPublic } from '@epde/shared';
import { QUERY_KEYS } from '@epde/shared';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { type ClientFilters, getClient, getClients } from '@/lib/api/clients';

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
