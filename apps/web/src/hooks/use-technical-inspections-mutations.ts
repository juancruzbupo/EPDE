import type {
  CreateTechnicalInspectionInput,
  MarkInspectionPaidInput,
  ScheduleInspectionInput,
  UpdateInspectionStatusInput,
  UploadDeliverableInput,
} from '@epde/shared';
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  cancelTechnicalInspection,
  createTechnicalInspection,
  markTechnicalInspectionPaid,
  scheduleTechnicalInspection,
  updateTechnicalInspectionStatus,
  uploadTechnicalInspectionDeliverable,
} from '@/lib/api/technical-inspections';

function useInvalidate(id?: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.technicalInspections] });
    if (id) queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.technicalInspections, id] });
  };
}

export function useCreateTechnicalInspection() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (dto: CreateTechnicalInspectionInput) => createTechnicalInspection(dto),
    onSuccess: () => {
      toast.success('Inspección solicitada. Te contactaremos para agendar la visita.');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al solicitar inspección')),
  });
}

export function useScheduleTechnicalInspection(id: string) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: (dto: ScheduleInspectionInput) => scheduleTechnicalInspection(id, dto),
    onSuccess: () => {
      toast.success('Inspección agendada');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al agendar')),
  });
}

export function useUpdateTechnicalInspectionStatus(id: string) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: (dto: UpdateInspectionStatusInput) => updateTechnicalInspectionStatus(id, dto),
    onSuccess: () => {
      toast.success('Estado actualizado');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al actualizar estado')),
  });
}

export function useUploadTechnicalInspectionDeliverable(id: string) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: (dto: UploadDeliverableInput) => uploadTechnicalInspectionDeliverable(id, dto),
    onSuccess: () => {
      toast.success('Informe subido — el cliente ya puede verlo y pagar');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al subir informe')),
  });
}

export function useMarkTechnicalInspectionPaid(id: string) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: (dto: MarkInspectionPaidInput) => markTechnicalInspectionPaid(id, dto),
    onSuccess: () => {
      toast.success('Pago registrado');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al marcar pagada')),
  });
}

export function useCancelTechnicalInspection() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => cancelTechnicalInspection(id),
    onSuccess: () => {
      toast.success('Inspección cancelada');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al cancelar')),
  });
}
