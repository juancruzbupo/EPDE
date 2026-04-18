import type { TechnicalInspectionFilters } from '@epde/shared';
import { QUERY_KEYS, STALE_TIME } from '@epde/shared';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { getTechnicalInspection, getTechnicalInspections } from '@/lib/api/technical-inspections';

export function useTechnicalInspections(filters: Omit<TechnicalInspectionFilters, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.technicalInspections, filters],
    queryFn: ({ pageParam, signal }) =>
      getTechnicalInspections({ ...filters, cursor: pageParam }, signal),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    maxPages: 10,
    staleTime: STALE_TIME.VOLATILE,
  });
}

export function useTechnicalInspection(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.technicalInspections, id],
    queryFn: ({ signal }) => getTechnicalInspection(id, signal).then((r) => r.data),
    enabled: !!id,
    staleTime: STALE_TIME.VOLATILE,
  });
}
