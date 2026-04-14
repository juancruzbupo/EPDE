import type { ServiceRequestPublic } from '@epde/shared';
import { QUERY_KEYS } from '@epde/shared';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import {
  getServiceRequest,
  getServiceRequestAuditLog,
  getServiceRequestComments,
  getServiceRequests,
  type ServiceRequestFilters,
} from '@/lib/api/service-requests';

import { STALE_TIME } from './query-stale-times';

export function useServiceRequests(filters: Omit<ServiceRequestFilters, 'cursor'>) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.serviceRequests, filters],
    queryFn: ({ pageParam, signal }) =>
      getServiceRequests({ ...filters, cursor: pageParam }, signal),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    maxPages: 10,
    staleTime: STALE_TIME.VOLATILE,
  });
}

export function useServiceRequest(id: string, options?: { initialData?: ServiceRequestPublic }) {
  return useQuery({
    queryKey: [QUERY_KEYS.serviceRequests, id],
    queryFn: ({ signal }) => getServiceRequest(id, signal).then((r) => r.data),
    initialData: options?.initialData,
    enabled: !!id,
    staleTime: STALE_TIME.VOLATILE,
  });
}

// ─── Audit Log ──────────────────────────────────────────

export function useServiceRequestAuditLog(serviceRequestId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.serviceRequests, serviceRequestId, QUERY_KEYS.serviceRequestAuditLog],
    queryFn: ({ signal }) =>
      getServiceRequestAuditLog(serviceRequestId, signal).then((r) => r.data),
    enabled: !!serviceRequestId,
    staleTime: STALE_TIME.SLOW,
  });
}

// ─── Comments ───────────────────────────────────────────

export function useServiceRequestComments(serviceRequestId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.serviceRequests, serviceRequestId, QUERY_KEYS.serviceRequestComments],
    queryFn: ({ signal }) =>
      getServiceRequestComments(serviceRequestId, signal).then((r) => r.data),
    enabled: !!serviceRequestId,
    staleTime: STALE_TIME.MEDIUM,
  });
}
