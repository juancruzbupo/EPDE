import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import type { ApiResponse, ServiceRequestPublic } from '@epde/shared';
import {
  getServiceRequests,
  getServiceRequest,
  createServiceRequest,
  updateServiceStatus,
  type ServiceRequestFilters,
} from '@/lib/api/service-requests';

export function useServiceRequests(filters: ServiceRequestFilters) {
  return useInfiniteQuery({
    queryKey: ['service-requests', filters],
    queryFn: ({ pageParam, signal }) =>
      getServiceRequests({ ...filters, cursor: pageParam }, signal),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });
}

export function useServiceRequest(
  id: string,
  options?: { initialData?: ApiResponse<ServiceRequestPublic> },
) {
  return useQuery({
    queryKey: ['service-requests', id],
    queryFn: ({ signal }) => getServiceRequest(id, signal),
    initialData: options?.initialData,
    enabled: !!id,
  });
}

export function useCreateServiceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createServiceRequest,
    onSuccess: () => {
      toast.success('Solicitud creada');
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'activity'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al crear solicitud'));
    },
  });
}

export function useUpdateServiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateServiceStatus(id, status),
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'activity'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al actualizar estado'));
    },
  });
}
