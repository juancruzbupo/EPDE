import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import {
  getBudgets,
  getBudget,
  createBudgetRequest,
  updateBudgetStatus,
  type BudgetFilters,
} from '@/lib/api/budgets';
import type { BudgetRequestPublic, BudgetStatus } from '@epde/shared/types';
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';

export function useBudgets(filters: Omit<BudgetFilters, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.budgets, filters],
    queryFn: ({ pageParam, signal }) => getBudgets({ ...filters, cursor: pageParam }, signal),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    maxPages: 10,
  });
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.budgets, id],
    queryFn: ({ signal }) => getBudget(id, signal).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateBudgetRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBudgetRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.budgets] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, 'client-stats'] });
    },
    onError: (err) => {
      Alert.alert('Error', getErrorMessage(err, 'Error al crear presupuesto'));
    },
  });
}

export function useUpdateBudgetStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateBudgetStatus(id, status),

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.budgets, variables.id] });
      const previous = queryClient.getQueryData<BudgetRequestPublic>([
        QUERY_KEYS.budgets,
        variables.id,
      ]);
      queryClient.setQueryData<BudgetRequestPublic>([QUERY_KEYS.budgets, variables.id], (old) => {
        if (!old) return old;
        return { ...old, status: variables.status as BudgetStatus };
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, 'client-stats'] });
    },
  });
}
