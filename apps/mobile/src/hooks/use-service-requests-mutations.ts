/**
 * Mobile service request mutations. Web equivalent: apps/web/src/hooks/use-service-requests-mutations.ts
 *
 * Mobile is CLIENT-only: only mutations exposed to clients live here
 * (create, edit, status update, comments, attachments). Admin-only
 * transitions (in-review → in-progress → resolved → closed) happen in
 * the web panel.
 */
import type { ServiceRequestPublic, ServiceStatus, ServiceUrgency } from '@epde/shared';
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  addServiceRequestAttachments,
  createServiceRequest,
  createServiceRequestComment,
  editServiceRequest,
  updateServiceStatus,
} from '@/lib/api/service-requests';
import { haptics } from '@/lib/haptics';
import { invalidateDashboard } from '@/lib/invalidate-dashboard';
import { toast } from '@/lib/toast';

export function useCreateServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createServiceRequest,
    onSuccess: () => {
      haptics.success();
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.serviceRequests] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.properties] });
      invalidateDashboard(queryClient);
      toast.success('Solicitud creada. Podés seguir el estado en la sección de servicios.');
    },
    onError: (err) => {
      haptics.error();
      toast.error(getErrorMessage(err, 'Error al crear solicitud'));
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
      toast.success('Solicitud actualizada');
    },
    onError: (err) => {
      haptics.error();
      toast.error(getErrorMessage(err, 'Error al editar solicitud'));
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
      toast.error(getErrorMessage(_err, 'Error al actualizar estado'));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.serviceRequests] });
      invalidateDashboard(queryClient);
    },
  });
}

/** Adds a comment to a service request thread. Does NOT invalidate dashboard —
 *  comments don't feed counters. */
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
      toast.success('Comentario agregado');
    },
    onError: (err) => {
      haptics.error();
      toast.error(getErrorMessage(err, 'Error al agregar comentario'));
    },
  });
}

/** Adds attachments to an existing service request. Does NOT invalidate
 *  dashboard — attachments don't feed counters. */
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
      toast.success('Adjuntos agregados');
    },
    onError: (err) => {
      haptics.error();
      toast.error(getErrorMessage(err, 'Error al agregar adjuntos'));
    },
  });
}
