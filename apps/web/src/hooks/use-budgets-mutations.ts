import type {
  BudgetRequestPublic,
  BudgetStatus,
  CreateBudgetCommentInput,
  EditBudgetRequestInput,
  RespondBudgetInput,
} from '@epde/shared';
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  addBudgetAttachments,
  createBudgetComment,
  createBudgetRequest,
  editBudgetRequest,
  respondToBudget,
  updateBudgetStatus,
} from '@/lib/api/budgets';
import { invalidateDashboard } from '@/lib/invalidate-dashboard';

/**
 * Picks a status-aware confirmation message instead of a generic
 * "Estado actualizado". Older / non-technical users benefit from being
 * told what to expect after each transition (especially APPROVED, where
 * the next step is async work by the EPDE team).
 */
function getStatusChangeMessage(status: BudgetStatus): string {
  switch (status) {
    case 'APPROVED':
      return '¡Aprobado! El trabajo va a comenzar pronto. Te avisamos cuando avance.';
    case 'REJECTED':
      return 'Presupuesto rechazado. Si querés, podés comentar el motivo en el detalle.';
    case 'IN_PROGRESS':
      return 'Trabajo en curso. Te avisamos cuando esté terminado.';
    case 'COMPLETED':
      return 'Trabajo completado. Revisá el detalle y dejá un comentario si te quedó alguna duda.';
    default:
      return 'Estado actualizado';
  }
}

export function useCreateBudgetRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBudgetRequest,
    onSuccess: () => {
      toast.success('Presupuesto creado');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.budgets] });
      invalidateDashboard(queryClient);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al crear presupuesto'));
    },
  });
}

/** Edits budget details (title/description) — does NOT invalidate dashboard.
 *  Only status transitions affect dashboard counters (see useUpdateBudgetStatus). */
export function useEditBudgetRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & EditBudgetRequestInput) =>
      editBudgetRequest(id, dto),
    onSuccess: () => {
      toast.success('Presupuesto actualizado');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.budgets] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al actualizar presupuesto'));
    },
  });
}

export function useRespondToBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & RespondBudgetInput) => respondToBudget(id, dto),
    onSuccess: () => {
      toast.success('Cotización enviada');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.budgets] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al enviar cotización'));
    },
  });
}

export function useUpdateBudgetStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BudgetStatus }) =>
      updateBudgetStatus(id, status),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.budgets, variables.id] });
      const previous = queryClient.getQueryData<BudgetRequestPublic>([
        QUERY_KEYS.budgets,
        variables.id,
      ]);
      queryClient.setQueryData<BudgetRequestPublic>([QUERY_KEYS.budgets, variables.id], (old) =>
        old ? { ...old, status: variables.status } : old,
      );
      return { previous };
    },
    onSuccess: (_data, variables) => toast.success(getStatusChangeMessage(variables.status)),
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEYS.budgets, variables.id], context.previous);
      }
      toast.error(getErrorMessage(err, 'Error al actualizar estado'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.budgets] });
      invalidateDashboard(queryClient);
    },
  });
}

// ─── Comments ──────────────────────────────────────────────

export function useAddBudgetComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ budgetId, ...dto }: { budgetId: string } & CreateBudgetCommentInput) =>
      createBudgetComment(budgetId, dto),
    onSuccess: (_data, variables) => {
      toast.success('Comentario agregado');
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.budgets, variables.budgetId, QUERY_KEYS.budgetComments],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.budgets, variables.budgetId, QUERY_KEYS.budgetAuditLog],
      });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al agregar comentario'));
    },
  });
}

// ─── Attachments ───────────────────────────────────────────

export function useAddBudgetAttachments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      budgetId,
      attachments,
    }: {
      budgetId: string;
      attachments: { url: string; fileName: string }[];
    }) => addBudgetAttachments(budgetId, { attachments }),
    onSuccess: (_data, variables) => {
      toast.success('Adjuntos agregados');
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.budgets, variables.budgetId],
      });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al agregar adjuntos'));
    },
  });
}
