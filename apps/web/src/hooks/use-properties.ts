import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { QUERY_KEYS, getErrorMessage } from '@epde/shared';
import type { UpdatePropertyInput, PropertyPublic } from '@epde/shared';
import {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  type PropertyFilters,
} from '@/lib/api/properties';

export function useProperties(filters: Omit<PropertyFilters, 'cursor'>) {
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

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProperty,
    onSuccess: () => {
      toast.success('Propiedad creada');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.properties] });
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
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al eliminar propiedad'));
    },
  });
}
