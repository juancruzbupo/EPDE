import type { ProfessionalFilters, ProfessionalSpecialty } from '@epde/shared';
import { QUERY_KEYS, STALE_TIME } from '@epde/shared';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import {
  getProfessional,
  getProfessionalPayments,
  getProfessionals,
  getSuggestedProfessionals,
} from '@/lib/api/professionals';

export function useProfessionals(filters: Omit<ProfessionalFilters, 'cursor'>) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.professionals, filters],
    queryFn: ({ pageParam, signal }) => getProfessionals({ ...filters, cursor: pageParam }, signal),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    maxPages: 10,
    staleTime: STALE_TIME.MEDIUM,
  });
}

export function useProfessional(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.professionals, id],
    queryFn: ({ signal }) => getProfessional(id, signal).then((r) => r.data),
    enabled: !!id,
    staleTime: STALE_TIME.MEDIUM,
  });
}

export function useProfessionalPayments(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.professionals, id, QUERY_KEYS.professionalPayments],
    queryFn: ({ signal }) => getProfessionalPayments(id, signal).then((r) => r.data),
    enabled: !!id,
    staleTime: STALE_TIME.MEDIUM,
  });
}

export function useSuggestedProfessionals(params: {
  specialty: ProfessionalSpecialty;
  serviceArea?: string;
  limit?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: [
      QUERY_KEYS.professionals,
      QUERY_KEYS.professionalSuggestions,
      params.specialty,
      params.serviceArea ?? null,
      params.limit ?? 3,
    ],
    queryFn: ({ signal }) =>
      getSuggestedProfessionals(
        {
          specialty: params.specialty,
          serviceArea: params.serviceArea,
          limit: params.limit ?? 3,
        },
        signal,
      ).then((r) => r.data),
    enabled: params.enabled !== false && !!params.specialty,
    staleTime: STALE_TIME.MEDIUM,
  });
}
