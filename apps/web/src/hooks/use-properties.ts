import type { PropertyPublic, UpdatePropertyInput } from '@epde/shared';
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { STALE_TIME } from '@epde/shared';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  createProperty,
  deleteProperty,
  getProperties,
  getProperty,
  getPropertyExpenses,
  getPropertyHealthHistory,
  getPropertyHealthIndex,
  getPropertyPhotos,
  getPropertyProblems,
  type PropertyFilters,
  updateProperty,
} from '@/lib/api/properties';
import { invalidateDashboard } from '@/lib/invalidate-dashboard';

export function useProperties(filters: Omit<PropertyFilters, 'cursor'>) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.properties, filters],
    queryFn: ({ pageParam, signal }) => getProperties({ ...filters, cursor: pageParam }, signal),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    maxPages: 10,
    staleTime: STALE_TIME.MEDIUM,
  });
}

export function useProperty(id: string, options?: { initialData?: PropertyPublic }) {
  return useQuery({
    queryKey: [QUERY_KEYS.properties, id],
    queryFn: ({ signal }) => getProperty(id, signal).then((r) => r.data),
    initialData: options?.initialData,
    enabled: !!id,
    staleTime: STALE_TIME.MEDIUM,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProperty,
    onSuccess: () => {
      toast.success('Propiedad creada');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.properties] });
      invalidateDashboard(queryClient);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al crear propiedad'));
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & UpdatePropertyInput) => updateProperty(id, dto),
    onSuccess: () => {
      toast.success('Propiedad actualizada');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.properties] });
      invalidateDashboard(queryClient);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al actualizar propiedad'));
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProperty,
    onSuccess: () => {
      toast.success('Propiedad eliminada');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.properties] });
      invalidateDashboard(queryClient);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al eliminar propiedad'));
    },
  });
}

export function usePropertyExpenses(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.properties, id, QUERY_KEYS.propertyExpenses],
    queryFn: ({ signal }) => getPropertyExpenses(id, signal).then((r) => r.data),
    enabled: !!id,
    staleTime: STALE_TIME.SLOW,
  });
}

export function usePropertyPhotos(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.properties, id, QUERY_KEYS.propertyPhotos],
    queryFn: ({ signal }) => getPropertyPhotos(id, signal).then((r) => r.data),
    enabled: !!id,
    staleTime: STALE_TIME.SLOW,
  });
}

export function usePropertyHealthIndex(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.properties, id, QUERY_KEYS.propertyHealthIndex],
    queryFn: ({ signal }) => getPropertyHealthIndex(id, signal).then((r) => r.data),
    enabled: !!id,
    staleTime: STALE_TIME.SLOW,
  });
}

export function usePropertyHealthHistory(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.properties, id, QUERY_KEYS.propertyHealthHistory],
    queryFn: ({ signal }) => getPropertyHealthHistory(id, signal).then((r) => r.data),
    enabled: !!id,
    staleTime: STALE_TIME.SLOW,
  });
}

export function usePropertyProblems(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.properties, id, QUERY_KEYS.propertyProblems],
    queryFn: ({ signal }) => getPropertyProblems(id, signal).then((r) => r.data),
    enabled: !!id,
    staleTime: STALE_TIME.MEDIUM,
  });
}
