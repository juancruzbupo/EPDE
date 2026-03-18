/**
 * Mobile property hooks — read-only.
 * Mutation hooks (create, update, delete) are omitted because:
 * - create/delete are admin-only operations (mobile is client-only)
 * - update has no UI in the mobile app (property editing is web-only)
 */
import type { PropertyPublic } from '@epde/shared';
import { QUERY_KEYS } from '@epde/shared';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import {
  getProperties,
  getProperty,
  getPropertyExpenses,
  getPropertyHealthHistory,
  getPropertyHealthIndex,
  getPropertyPhotos,
  type PropertyFilters,
} from '@/lib/api/properties';

/** Mobile is CLIENT-only — filters default to {} (no admin filtering needed). Web requires filters explicitly. */
export function useProperties(filters: Omit<PropertyFilters, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.properties, filters],
    queryFn: ({ pageParam, signal }) => getProperties({ ...filters, cursor: pageParam }, signal),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    maxPages: 10,
  });
}

export function useProperty(id: string, options?: { initialData?: PropertyPublic }) {
  return useQuery({
    queryKey: [QUERY_KEYS.properties, id],
    queryFn: ({ signal }) => getProperty(id, signal).then((r) => r.data),
    initialData: options?.initialData,
    enabled: !!id,
  });
}

export function usePropertyExpenses(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.properties, id, QUERY_KEYS.propertyExpenses],
    queryFn: ({ signal }) => getPropertyExpenses(id, signal).then((r) => r.data),
    enabled: !!id,
  });
}

export function usePropertyPhotos(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.properties, id, QUERY_KEYS.propertyPhotos],
    queryFn: ({ signal }) => getPropertyPhotos(id, signal).then((r) => r.data),
    enabled: !!id,
  });
}

export function usePropertyHealthIndex(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.properties, id, QUERY_KEYS.propertyHealthIndex],
    queryFn: ({ signal }) => getPropertyHealthIndex(id, signal).then((r) => r.data),
    enabled: !!id,
  });
}

export function usePropertyHealthHistory(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.properties, id, QUERY_KEYS.propertyHealthHistory],
    queryFn: ({ signal }) => getPropertyHealthHistory(id, signal).then((r) => r.data),
    enabled: !!id,
  });
}
