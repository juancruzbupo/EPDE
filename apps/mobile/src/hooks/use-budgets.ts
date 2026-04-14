/**
 * Mobile budget hooks.
 * Web equivalent: apps/web/src/hooks/use-budgets.ts
 *
 * Mutations included (client can approve/reject budgets and create comments).
 * Admin-only mutations (respond/re-quote, start-work, complete) are omitted
 * because mobile admin performs those actions via the web panel.
 *
 * If the budget API response shape changes, update BOTH this file and the web hook.
 */
import type {
  BudgetRequestPublic,
  BudgetStatus,
  CreateBudgetCommentInput,
  EditBudgetRequestInput,
  RespondBudgetInput,
} from '@epde/shared';
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addBudgetAttachments,
  type BudgetFilters,
  createBudgetComment,
  createBudgetRequest,
  editBudgetRequest,
  getBudget,
  getBudgetAuditLog,
  getBudgetComments,
  getBudgets,
  respondToBudget,
  updateBudgetStatus,
} from '@/lib/api/budgets';
import { haptics } from '@/lib/haptics';
import { invalidateClientDashboard } from '@/lib/invalidate-dashboard';
import { toast } from '@/lib/toast';

import { STALE_TIME } from './query-stale-times';

/** Mobile is CLIENT-only — filters default to {} (no admin filtering needed). Web requires filters explicitly. */
export function useBudgets(filters: Omit<BudgetFilters, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.budgets, filters],
    queryFn: ({ pageParam, signal }) => getBudgets({ ...filters, cursor: pageParam }, signal),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    maxPages: 10,
    staleTime: STALE_TIME.MEDIUM,
  });
}

export function useBudget(id: string, options?: { initialData?: BudgetRequestPublic }) {
  return useQuery({
    queryKey: [QUERY_KEYS.budgets, id],
    queryFn: ({ signal }) => getBudget(id, signal).then((r) => r.data),
    initialData: options?.initialData,
    enabled: !!id,
    staleTime: STALE_TIME.MEDIUM,
  });
}

export function useCreateBudgetRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBudgetRequest,
    onSuccess: () => {
      haptics.success();
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.budgets] });
      invalidateClientDashboard(queryClient);
      toast.success('Presupuesto creado correctamente');
    },
    onError: (err) => {
      haptics.error();
      toast.error(getErrorMessage(err, 'Error al crear presupuesto'));
    },
  });
}

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
      invalidateClientDashboard(queryClient);
      toast.success('Cotización enviada');
    },
    onError: (err) => {
      haptics.error();
      toast.error(getErrorMessage(err, 'Error al enviar cotización'));
    },
  });
}

export function useUpdateBudgetStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BudgetStatus }) =>
      updateBudgetStatus(id, status),

    onSuccess: () => {
      haptics.success();
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
      invalidateClientDashboard(queryClient);
    },
  });
}

// ─── Audit Log ─────────────────────────────────────────────

export function useBudgetAuditLog(budgetId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.budgets, budgetId, QUERY_KEYS.budgetAuditLog],
    queryFn: ({ signal }) => getBudgetAuditLog(budgetId, signal).then((r) => r.data),
    enabled: !!budgetId,
    staleTime: STALE_TIME.SLOW,
  });
}

// ─── Comments ──────────────────────────────────────────────

export function useBudgetComments(budgetId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.budgets, budgetId, QUERY_KEYS.budgetComments],
    queryFn: ({ signal }) => getBudgetComments(budgetId, signal).then((r) => r.data),
    enabled: !!budgetId,
    staleTime: STALE_TIME.VOLATILE,
  });
}

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
