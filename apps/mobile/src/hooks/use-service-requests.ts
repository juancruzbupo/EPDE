import type { ServiceRequestPublic, ServiceStatus, ServiceUrgency } from '@epde/shared';
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

import {
  addServiceRequestAttachments,
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
import { haptics } from '@/lib/haptics';
import { invalidateClientDashboard } from '@/lib/invalidate-dashboard';

/** Mobile is CLIENT-only — filters default to {} (no admin filtering needed). Web requires filters explicitly. */
export function useServiceRequests(filters: Omit<ServiceRequestFilters, 'cursor'> = {}) {
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
      haptics.success();
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.serviceRequests] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.properties] });
      invalidateClientDashboard(queryClient);
      Alert.alert(
        'Solicitud creada',
        'Este problema ya está en proceso. Podés seguir el estado en la sección de servicios.',
      );
    },
    onError: (err) => {
      haptics.error();
      Alert.alert('Error', getErrorMessage(err, 'Error al crear solicitud'));
    },
  });
}

/** Edits service request details (title/description) — does NOT invalidate dashboard.
 *  Only status transitions affect dashboard counters. */
export function useEditServiceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...dto
    }: {
      id: string;
      title?: string;
      description?: string;
      urgency?: ServiceUrgency;
    }) => editServiceRequest(id, dto),
    onSuccess: () => {
      haptics.success();
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.serviceRequests] });
      Alert.alert('Éxito', 'Solicitud actualizada');
    },
    onError: (err) => {
      haptics.error();
      Alert.alert('Error', getErrorMessage(err, 'Error al editar solicitud'));
    },
  });
}

export function useUpdateServiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: ServiceStatus; note?: string }) =>
      updateServiceStatus(id, status, note),

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.serviceRequests, variables.id] });
      const previous = queryClient.getQueryData<ServiceRequestPublic>([
        QUERY_KEYS.serviceRequests,
        variables.id,
      ]);
      queryClient.setQueryData<ServiceRequestPublic>(
        [QUERY_KEYS.serviceRequests, variables.id],
        (old) => (old ? { ...old, status: variables.status } : old),
      );
      return { previous };
    },

    onSuccess: () => {
      haptics.success();
    },

    onError: (_err, variables, context) => {
      haptics.error();
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEYS.serviceRequests, variables.id], context.previous);
      }
      Alert.alert('Error', getErrorMessage(_err, 'Error al actualizar estado'));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.serviceRequests] });
      invalidateClientDashboard(queryClient);
    },
  });
}

// ─── Audit Log ──────────────────────────────────────────

export function useServiceRequestAuditLog(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.serviceRequests, id, QUERY_KEYS.serviceRequestAuditLog],
    queryFn: ({ signal }) => getServiceRequestAuditLog(id, signal).then((r) => r.data),
    enabled: !!id,
  });
}

// ─── Comments ───────────────────────────────────────────

export function useServiceRequestComments(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.serviceRequests, id, QUERY_KEYS.serviceRequestComments],
    queryFn: ({ signal }) => getServiceRequestComments(id, signal).then((r) => r.data),
    enabled: !!id,
  });
}

export function useAddServiceRequestComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceRequestId, content }: { serviceRequestId: string; content: string }) =>
      createServiceRequestComment(serviceRequestId, { content }),
    onSuccess: (_, { serviceRequestId }) => {
      haptics.success();
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.serviceRequests, serviceRequestId, QUERY_KEYS.serviceRequestComments],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.serviceRequests, serviceRequestId, QUERY_KEYS.serviceRequestAuditLog],
      });
      Alert.alert('Éxito', 'Comentario agregado');
    },
    onError: (err) => {
      haptics.error();
      Alert.alert('Error', getErrorMessage(err, 'Error al agregar comentario'));
    },
  });
}

// ─── Attachments ───────────────────────────────────────────

export function useAddServiceRequestAttachments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      serviceRequestId,
      attachments,
    }: {
      serviceRequestId: string;
      attachments: { url: string; fileName: string }[];
    }) => addServiceRequestAttachments(serviceRequestId, { attachments }),
    onSuccess: (_data, variables) => {
      haptics.success();
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.serviceRequests, variables.serviceRequestId],
      });
      Alert.alert('Éxito', 'Adjuntos agregados');
    },
    onError: (err) => {
      haptics.error();
      Alert.alert('Error', getErrorMessage(err, 'Error al agregar adjuntos'));
    },
  });
}
