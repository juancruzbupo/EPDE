import type {
  BudgetRequestPublic,
  BudgetStatus,
  CreateBudgetCommentInput,
  EditBudgetRequestInput,
  RespondBudgetInput,
} from '@epde/shared';
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

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
import { invalidateClientDashboard } from '@/lib/invalidate-dashboard';

/** Mobile is CLIENT-only — filters default to {} (no admin filtering needed). Web requires filters explicitly. */
export function useBudgets(filters: Omit<BudgetFilters, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.budgets, filters],
    queryFn: ({ pageParam, signal }) => getBudgets({ ...filters, cursor: pageParam }, signal),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    maxPages: 10,
  });
}

export function useBudget(id: string, options?: { initialData?: BudgetRequestPublic }) {
  return useQuery({
    queryKey: [QUERY_KEYS.budgets, id],
    queryFn: ({ signal }) => getBudget(id, signal).then((r) => r.data),
    initialData: options?.initialData,
    enabled: !!id,
  });
}

export function useCreateBudgetRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBudgetRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.budgets] });
      invalidateClientDashboard(queryClient);
      Alert.alert('Éxito', 'Presupuesto creado correctamente');
    },
    onError: (err) => {
      Alert.alert('Error', getErrorMessage(err, 'Error al crear presupuesto'));
    },
  });
}

export function useEditBudgetRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & EditBudgetRequestInput) =>
      editBudgetRequest(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.budgets] });
      Alert.alert('Éxito', 'Presupuesto actualizado');
    },
    onError: (err) => {
      Alert.alert('Error', getErrorMessage(err, 'Error al actualizar presupuesto'));
    },
  });
}

export function useRespondToBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & RespondBudgetInput) => respondToBudget(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.budgets] });
      invalidateClientDashboard(queryClient);
      Alert.alert('Éxito', 'Cotización enviada');
    },
    onError: (err) => {
      Alert.alert('Error', getErrorMessage(err, 'Error al enviar cotización'));
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
      queryClient.setQueryData<BudgetRequestPublic>([QUERY_KEYS.budgets, variables.id], (old) => {
        if (!old) return old;
        return { ...old, status: variables.status };
      });
      return { previous };
    },

    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEYS.budgets, variables.id], context.previous);
      }
      Alert.alert('Error', getErrorMessage(_err, 'Error al actualizar estado'));
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
  });
}

// ─── Comments ──────────────────────────────────────────────

export function useBudgetComments(budgetId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.budgets, budgetId, QUERY_KEYS.budgetComments],
    queryFn: ({ signal }) => getBudgetComments(budgetId, signal).then((r) => r.data),
    enabled: !!budgetId,
  });
}

export function useAddBudgetComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ budgetId, ...dto }: { budgetId: string } & CreateBudgetCommentInput) =>
      createBudgetComment(budgetId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.budgets, variables.budgetId, QUERY_KEYS.budgetComments],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.budgets, variables.budgetId, QUERY_KEYS.budgetAuditLog],
      });
      Alert.alert('Éxito', 'Comentario agregado');
    },
    onError: (err) => {
      Alert.alert('Error', getErrorMessage(err, 'Error al agregar comentario'));
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
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.budgets, variables.budgetId],
      });
      Alert.alert('Éxito', 'Adjuntos agregados');
    },
    onError: (err) => {
      Alert.alert('Error', getErrorMessage(err, 'Error al agregar adjuntos'));
    },
  });
}
