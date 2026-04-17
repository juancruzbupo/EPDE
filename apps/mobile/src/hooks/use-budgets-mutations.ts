/**
 * Mobile budget mutations. Web equivalent: apps/web/src/hooks/use-budgets-mutations.ts
 *
 * Mobile is CLIENT-only: only mutations exposed to clients live here
 * (approve/reject, comments, attachments). Admin-only mutations
 * (respond/re-quote, start-work, complete) happen in the web panel.
 */
import type {
  BudgetRequestPublic,
  BudgetStatus,
  CreateBudgetCommentInput,
  EditBudgetRequestInput,
  RespondBudgetInput,
} from '@epde/shared';
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  addBudgetAttachments,
  createBudgetComment,
  createBudgetRequest,
  editBudgetRequest,
  respondToBudget,
  updateBudgetStatus,
} from '@/lib/api/budgets';
import { haptics } from '@/lib/haptics';
import { invalidateDashboard } from '@/lib/invalidate-dashboard';
import { toast } from '@/lib/toast';

export function useCreateBudgetRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBudgetRequest,
    onSuccess: () => {
      haptics.success();
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.budgets] });
      invalidateDashboard(queryClient);
      toast.success('Presupuesto creado correctamente');
    },
    onError: (err) => {
      haptics.error();
      toast.error(getErrorMessage(err, 'Error al crear presupuesto'));
    },
  });
}

/** Edits title/description of a PENDING budget. Does NOT invalidate dashboard —
 *  only status transitions move counters (see SIEMPRE #59 in ai-development-guide). */
export function useEditBudgetRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & EditBudgetRequestInput) =>
      editBudgetRequest(id, dto),
    onSuccess: () => {
      haptics.success();
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.budgets] });
      toast.success('Presupuesto actualizado');
    },
    onError: (err) => {
      haptics.error();
      toast.error(getErrorMessage(err, 'Error al actualizar presupuesto'));
    },
  });
}

export function useRespondToBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & RespondBudgetInput) => respondToBudget(id, dto),
    onSuccess: () => {
      haptics.success();
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.budgets] });
      invalidateDashboard(queryClient);
      toast.success('Cotización enviada');
    },
    onError: (err) => {
      haptics.error();
      toast.error(getErrorMessage(err, 'Error al enviar cotización'));
    },
  });
}

function getBudgetStatusChangeMessage(status: BudgetStatus): string {
  switch (status) {
    case 'APPROVED':
      return '¡Aprobado! Actuar ahora previene que el problema escale — las reparaciones correctivas cuestan entre 8x y 15x más.';
    case 'REJECTED':
      return 'Presupuesto rechazado. Si querés, comentá el motivo en el detalle.';
    case 'IN_PROGRESS':
      return 'Trabajo en curso. Te avisamos cuando esté terminado.';
    case 'COMPLETED':
      return 'Trabajo completado. Revisá el detalle.';
    default:
      return 'Estado actualizado';
  }
}

export function useUpdateBudgetStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BudgetStatus }) =>
      updateBudgetStatus(id, status),

    onSuccess: (_data, variables) => {
      haptics.success();
      toast.success(getBudgetStatusChangeMessage(variables.status));
    },

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

    onError: (_err, variables, context) => {
      haptics.error();
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEYS.budgets, variables.id], context.previous);
      }
      toast.error(getErrorMessage(_err, 'Error al actualizar estado'));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.budgets] });
      invalidateDashboard(queryClient);
    },
  });
}

/** Adds a comment to a budget thread. Does NOT invalidate dashboard — comments
 *  are not part of any client stat. */
export function useAddBudgetComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ budgetId, ...dto }: { budgetId: string } & CreateBudgetCommentInput) =>
      createBudgetComment(budgetId, dto),
    onSuccess: (_data, variables) => {
      haptics.success();
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.budgets, variables.budgetId, QUERY_KEYS.budgetComments],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.budgets, variables.budgetId, QUERY_KEYS.budgetAuditLog],
      });
      toast.success('Comentario agregado');
    },
    onError: (err) => {
      haptics.error();
      toast.error(getErrorMessage(err, 'Error al agregar comentario'));
    },
  });
}

/** Adds attachments to an existing budget. Does NOT invalidate dashboard —
 *  attachments don't feed counters. */
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
      haptics.success();
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.budgets, variables.budgetId],
      });
      toast.success('Adjuntos agregados');
    },
    onError: (err) => {
      haptics.error();
      toast.error(getErrorMessage(err, 'Error al agregar adjuntos'));
    },
  });
}
