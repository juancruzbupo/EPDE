import type { ServiceRequestPublic, ServiceStatus } from '@epde/shared';
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  createServiceRequest,
  createServiceRequestComment,
  editServiceRequest,
  getServiceRequest,
  getServiceRequestAuditLog,
  getServiceRequestComments,
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

export function useEditServiceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string; title?: string; description?: string }) =>
      editServiceRequest(id, dto),
    onSuccess: () => {
      toast.success('Solicitud actualizada');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.serviceRequests] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al editar solicitud'));
    },
  });
}

export function useUpdateServiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: ServiceStatus; note?: string }) =>
      updateServiceStatus(id, status, note),
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

// ─── Audit Log ──────────────────────────────────────────

export function useServiceRequestAuditLog(serviceRequestId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.serviceRequests, serviceRequestId, QUERY_KEYS.serviceRequestAuditLog],
    queryFn: ({ signal }) =>
      getServiceRequestAuditLog(serviceRequestId, signal).then((r) => r.data),
    enabled: !!serviceRequestId,
  });
}

// ─── Comments ───────────────────────────────────────────

export function useServiceRequestComments(serviceRequestId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.serviceRequests, serviceRequestId, QUERY_KEYS.serviceRequestComments],
    queryFn: ({ signal }) =>
      getServiceRequestComments(serviceRequestId, signal).then((r) => r.data),
    enabled: !!serviceRequestId,
  });
}

export function useAddServiceRequestComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceRequestId, content }: { serviceRequestId: string; content: string }) =>
      createServiceRequestComment(serviceRequestId, { content }),
    onSuccess: (_, { serviceRequestId }) => {
      toast.success('Comentario agregado');
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.serviceRequests, serviceRequestId, QUERY_KEYS.serviceRequestComments],
      });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al agregar comentario'));
    },
  });
}
