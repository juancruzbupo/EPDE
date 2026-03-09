import type { ServiceRequestPublic, ServiceStatus } from '@epde/shared';
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  createServiceRequest,
  getServiceRequest,
  getServiceRequests,
  type ServiceRequestFilters,
  updateServiceStatus,
} from '@/lib/api/service-requests';
import { invalidateDashboard } from '@/lib/invalidate-dashboard';

export function useServiceRequests(filters: Omit<ServiceRequestFilters, 'cursor'>) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.serviceRequests, filters],
    queryFn: ({ pageParam, signal }) =>
      getServiceRequests({ ...filters, cursor: pageParam }, signal),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    maxPages: 10,
  });
}

export function useServiceRequest(id: string, options?: { initialData?: ServiceRequestPublic }) {
  return useQuery({
    queryKey: [QUERY_KEYS.serviceRequests, id],
    queryFn: ({ signal }) => getServiceRequest(id, signal).then((r) => r.data),
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.serviceRequests] });
      invalidateDashboard(queryClient);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al crear solicitud'));
    },
  });
}

export function useUpdateServiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ServiceStatus }) =>
      updateServiceStatus(id, status),
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.serviceRequests] });
      invalidateDashboard(queryClient);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al actualizar estado'));
    },
  });
}
