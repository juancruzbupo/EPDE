import type {
  AddInspectionItemInput,
  CreateInspectionInput,
  UpdateInspectionItemInput,
} from '@epde/shared';
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  addInspectionItem,
  createInspection,
  deleteInspection,
  generatePlanFromInspection,
  getInspections,
  getInspectionTemplates,
  updateInspectionItem,
} from '@/lib/api/inspections';

export function useInspections(propertyId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.inspections, propertyId],
    queryFn: ({ signal }) => getInspections(propertyId, signal).then((r) => r.data),
    enabled: !!propertyId,
  });
}

export function useCreateInspection(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateInspectionInput) => createInspection(dto).then((r) => r.data),
    onSuccess: () => {
      toast.success('Nueva inspección creada');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.inspections, propertyId] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al crear inspección'));
    },
  });
}

export function useUpdateInspectionItem(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, ...dto }: UpdateInspectionItemInput & { itemId: string }) =>
      updateInspectionItem(itemId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.inspections, propertyId] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al actualizar'));
    },
  });
}

export function useAddInspectionItem(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ checklistId, ...dto }: AddInspectionItemInput & { checklistId: string }) =>
      addInspectionItem(checklistId, dto),
    onSuccess: () => {
      toast.success('Item agregado');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.inspections, propertyId] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al agregar item'));
    },
  });
}

export function useInspectionTemplates(propertyId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.inspections, 'templates', propertyId],
    queryFn: ({ signal }) => getInspectionTemplates(propertyId, signal).then((r) => r.data),
    enabled: !!propertyId,
  });
}

export function useGeneratePlan(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ checklistId, planName }: { checklistId: string; planName: string }) =>
      generatePlanFromInspection(checklistId, planName),
    onSuccess: () => {
      toast.success('Plan de mantenimiento generado');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.inspections, propertyId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.properties] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al generar plan'));
    },
  });
}

export function useDeleteInspection(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInspection(id),
    onSuccess: () => {
      toast.success('Inspección eliminada');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.inspections, propertyId] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al eliminar inspección'));
    },
  });
}
