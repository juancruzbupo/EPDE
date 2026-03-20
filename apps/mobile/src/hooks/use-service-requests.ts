/**
 * Mobile service request hooks — client operations only.
 * `useUpdateServiceStatus` is omitted because status transitions
 * are admin-only (`@Roles(UserRole.ADMIN)` on the endpoint).
 */
import type { ServiceRequestPublic, ServiceUrgency } from '@epde/shared';
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
} from '@/lib/api/service-requests';
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.serviceRequests] });
      invalidateClientDashboard(queryClient);
      Alert.alert('Éxito', 'Solicitud creada correctamente');
    },
    onError: (err) => {
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.serviceRequests] });
      Alert.alert('Éxito', 'Solicitud actualizada');
    },
    onError: (err) => {
      Alert.alert('Error', getErrorMessage(err, 'Error al editar solicitud'));
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
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.serviceRequests, serviceRequestId, QUERY_KEYS.serviceRequestComments],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.serviceRequests, serviceRequestId, QUERY_KEYS.serviceRequestAuditLog],
      });
      Alert.alert('Éxito', 'Comentario agregado');
    },
    onError: (err) => {
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
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.serviceRequests, variables.serviceRequestId],
      });
      Alert.alert('Éxito', 'Adjuntos agregados');
    },
    onError: (err) => {
      Alert.alert('Error', getErrorMessage(err, 'Error al agregar adjuntos'));
    },
  });
}
