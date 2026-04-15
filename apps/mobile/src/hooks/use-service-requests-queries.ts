/**
 * Mobile service request queries. Web equivalent: apps/web/src/hooks/use-service-requests-queries.ts
 *
 * Split from mutations so neither file exceeds 150 LOC. See ADR-012 + the
 * eslint max-lines rule on apps/mobile/src/hooks/.
 */
import type { ServiceRequestPublic } from '@epde/shared';
import { QUERY_KEYS, STALE_TIME } from '@epde/shared';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import {
  getServiceRequest,
  getServiceRequestAuditLog,
  getServiceRequestComments,
  getServiceRequests,
  type ServiceRequestFilters,
} from '@/lib/api/service-requests';

/** Mobile is CLIENT-only — filters default to {} (no admin filtering needed). Web requires filters explicitly. */
export function useServiceRequests(filters: Omit<ServiceRequestFilters, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.serviceRequests, filters],
    queryFn: ({ pageParam, signal }) =>
      getServiceRequests({ ...filters, cursor: pageParam }, signal),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    maxPages: 10,
    staleTime: STALE_TIME.MEDIUM,
  });
}

export function useServiceRequest(id: string, options?: { initialData?: ServiceRequestPublic }) {
  return useQuery({
    queryKey: [QUERY_KEYS.serviceRequests, id],
    queryFn: ({ signal }) => getServiceRequest(id, signal).then((r) => r.data),
    initialData: options?.initialData,
    enabled: !!id,
    staleTime: STALE_TIME.MEDIUM,
  });
}

export function useServiceRequestAuditLog(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.serviceRequests, id, QUERY_KEYS.serviceRequestAuditLog],
    queryFn: ({ signal }) => getServiceRequestAuditLog(id, signal).then((r) => r.data),
    enabled: !!id,
    staleTime: STALE_TIME.SLOW,
  });
}

export function useServiceRequestComments(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.serviceRequests, id, QUERY_KEYS.serviceRequestComments],
    queryFn: ({ signal }) => getServiceRequestComments(id, signal).then((r) => r.data),
    enabled: !!id,
    staleTime: STALE_TIME.VOLATILE,
  });
}
