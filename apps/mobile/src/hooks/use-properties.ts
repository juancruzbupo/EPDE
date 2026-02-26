import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getProperties, getProperty, type PropertyFilters } from '@/lib/api/properties';

export function useProperties(filters: Omit<PropertyFilters, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: ['properties', filters],
    queryFn: ({ pageParam }) => getProperties({ ...filters, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['properties', id],
    queryFn: () => getProperty(id).then((r) => r.data),
    enabled: !!id,
  });
}
