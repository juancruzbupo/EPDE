import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const data = (error as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  return fallback;
}
import {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  type PropertyFilters,
} from '@/lib/api/properties';

export function useProperties(filters: PropertyFilters) {
  return useInfiniteQuery({
    queryKey: ['properties', filters],
    queryFn: ({ pageParam, signal }) => getProperties({ ...filters, cursor: pageParam }, signal),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['properties', id],
    queryFn: ({ signal }) => getProperty(id, signal),
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProperty,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['properties'] }),
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al crear propiedad'));
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & Record<string, unknown>) =>
      updateProperty(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['properties'] }),
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al actualizar propiedad'));
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProperty,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['properties'] }),
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al eliminar propiedad'));
    },
  });
}
