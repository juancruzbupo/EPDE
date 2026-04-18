import type {
  CreateAssignmentInput,
  CreateAttachmentInput,
  CreatePaymentInput,
  CreateProfessionalInput,
  CreateRatingInput,
  CreateTagInput,
  CreateTimelineNoteInput,
  UpdateAvailabilityInput,
  UpdatePaymentStatusInput,
  UpdateProfessionalInput,
  UpdateTierInput,
} from '@epde/shared';
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  assignProfessional,
  createAttachment,
  createPayment,
  createProfessional,
  createRating,
  createTag,
  createTimelineNote,
  deleteAttachment,
  deleteProfessional,
  deleteRating,
  deleteTag,
  unassignProfessional,
  updateAvailability,
  updatePaymentStatus,
  updateProfessional,
  updateTier,
  verifyAttachment,
} from '@/lib/api/professionals';

function useInvalidateProfessional(id?: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.professionals] });
    if (id) queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.professionals, id] });
  };
}

export function useCreateProfessional() {
  const invalidate = useInvalidateProfessional();
  return useMutation({
    mutationFn: (dto: CreateProfessionalInput) => createProfessional(dto),
    onSuccess: () => {
      toast.success('Profesional creado');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al crear profesional')),
  });
}

export function useUpdateProfessional(id: string) {
  const invalidate = useInvalidateProfessional(id);
  return useMutation({
    mutationFn: (dto: UpdateProfessionalInput) => updateProfessional(id, dto),
    onSuccess: () => {
      toast.success('Profesional actualizado');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al actualizar')),
  });
}

export function useDeleteProfessional() {
  const invalidate = useInvalidateProfessional();
  return useMutation({
    mutationFn: (id: string) => deleteProfessional(id),
    onSuccess: () => {
      toast.success('Profesional eliminado');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al eliminar')),
  });
}

export function useUpdateTier(id: string) {
  const invalidate = useInvalidateProfessional(id);
  return useMutation({
    mutationFn: (dto: UpdateTierInput) => updateTier(id, dto),
    onSuccess: () => {
      toast.success('Tier actualizado');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al cambiar tier')),
  });
}

export function useUpdateAvailability(id: string) {
  const invalidate = useInvalidateProfessional(id);
  return useMutation({
    mutationFn: (dto: UpdateAvailabilityInput) => updateAvailability(id, dto),
    onSuccess: () => {
      toast.success('Disponibilidad actualizada');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al cambiar disponibilidad')),
  });
}

export function useCreateRating(id: string) {
  const invalidate = useInvalidateProfessional(id);
  return useMutation({
    mutationFn: (dto: CreateRatingInput) => createRating(id, dto),
    onSuccess: () => {
      toast.success('Valoración agregada');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al agregar valoración')),
  });
}

export function useDeleteRating(id: string) {
  const invalidate = useInvalidateProfessional(id);
  return useMutation({
    mutationFn: (ratingId: string) => deleteRating(id, ratingId),
    onSuccess: () => {
      toast.success('Valoración eliminada');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al eliminar valoración')),
  });
}

export function useCreateTimelineNote(id: string) {
  const invalidate = useInvalidateProfessional(id);
  return useMutation({
    mutationFn: (dto: CreateTimelineNoteInput) => createTimelineNote(id, dto),
    onSuccess: () => {
      toast.success('Nota agregada');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al agregar nota')),
  });
}

export function useCreateTag(id: string) {
  const invalidate = useInvalidateProfessional(id);
  return useMutation({
    mutationFn: (dto: CreateTagInput) => createTag(id, dto),
    onSuccess: () => invalidate(),
    onError: (err) => toast.error(getErrorMessage(err, 'Error al agregar tag')),
  });
}

export function useDeleteTag(id: string) {
  const invalidate = useInvalidateProfessional(id);
  return useMutation({
    mutationFn: (tag: string) => deleteTag(id, tag),
    onSuccess: () => invalidate(),
    onError: (err) => toast.error(getErrorMessage(err, 'Error al eliminar tag')),
  });
}

export function useCreateAttachment(id: string) {
  const invalidate = useInvalidateProfessional(id);
  return useMutation({
    mutationFn: (dto: CreateAttachmentInput) => createAttachment(id, dto),
    onSuccess: () => {
      toast.success('Adjunto subido');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al subir adjunto')),
  });
}

export function useVerifyAttachment(id: string) {
  const invalidate = useInvalidateProfessional(id);
  return useMutation({
    mutationFn: (attachmentId: string) => verifyAttachment(id, attachmentId),
    onSuccess: () => {
      toast.success('Adjunto verificado');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al verificar')),
  });
}

export function useDeleteAttachment(id: string) {
  const invalidate = useInvalidateProfessional(id);
  return useMutation({
    mutationFn: (attachmentId: string) => deleteAttachment(id, attachmentId),
    onSuccess: () => invalidate(),
    onError: (err) => toast.error(getErrorMessage(err, 'Error al eliminar adjunto')),
  });
}

export function useAssignProfessional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      serviceRequestId,
      ...dto
    }: { serviceRequestId: string } & CreateAssignmentInput) =>
      assignProfessional(serviceRequestId, dto),
    onSuccess: (_res, { serviceRequestId }) => {
      toast.success('Profesional asignado');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.serviceRequests] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.serviceRequests, serviceRequestId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.professionals] });
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al asignar')),
  });
}

export function useUnassignProfessional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serviceRequestId: string) => unassignProfessional(serviceRequestId),
    onSuccess: (_res, serviceRequestId) => {
      toast.success('Asignación removida');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.serviceRequests] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.serviceRequests, serviceRequestId] });
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al quitar asignación')),
  });
}

export function useCreatePayment(professionalId: string) {
  const invalidate = useInvalidateProfessional(professionalId);
  return useMutation({
    mutationFn: (dto: CreatePaymentInput) => createPayment(professionalId, dto),
    onSuccess: () => {
      toast.success('Pago registrado');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al registrar pago')),
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, ...dto }: { paymentId: string } & UpdatePaymentStatusInput) =>
      updatePaymentStatus(paymentId, dto),
    onSuccess: () => {
      toast.success('Pago actualizado');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.professionals] });
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al actualizar pago')),
  });
}
