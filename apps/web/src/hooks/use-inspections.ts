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
      toast.success('Actualizado correctamente');
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
    onSuccess: (response) => {
      toast.success('Plan de mantenimiento generado');
      // Optimistic write: stamp the freshly-created plan onto the cached property so
      // hasPlan flips true immediately, even if the subsequent invalidate refetch
      // is slow or fails transparently. The shape is a minimal placeholder; the
      // invalidate below fills in the rest.
      const freshPlan = response?.data as { id?: string; status?: string } | undefined;
      if (freshPlan?.id) {
        queryClient.setQueryData([QUERY_KEYS.properties, propertyId], (prev: unknown) => {
          if (!prev || typeof prev !== 'object') return prev;
          return {
            ...(prev as Record<string, unknown>),
            maintenancePlan: {
              id: freshPlan.id,
              status: freshPlan.status ?? 'DRAFT',
            },
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.inspections, propertyId] });
      // A new plan is created; the list needs to refresh but individual plan details don't.
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plans, QUERY_KEYS.plansList] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.properties, propertyId] });
    },
    onError: (err) => {
      const status = (err as { response?: { status?: number } } | undefined)?.response?.status;
      if (status === 409) {
        // The property already has a plan — this likely means a concurrent request
        // (or stale UI) beat us to it. Resync so the UI reflects reality and stops
        // offering the Generate button.
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.properties, propertyId] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.inspections, propertyId] });
      }
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
