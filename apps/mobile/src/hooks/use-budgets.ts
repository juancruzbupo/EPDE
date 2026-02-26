import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBudgets,
  getBudget,
  createBudgetRequest,
  updateBudgetStatus,
  type BudgetFilters,
} from '@/lib/api/budgets';
import type { BudgetRequestPublic, BudgetStatus } from '@epde/shared/types';

export function useBudgets(filters: Omit<BudgetFilters, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: ['budgets', filters],
    queryFn: ({ pageParam }) => getBudgets({ ...filters, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: ['budgets', id],
    queryFn: () => getBudget(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateBudgetRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBudgetRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateBudgetStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateBudgetStatus(id, status),

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['budgets', variables.id] });
      const previous = queryClient.getQueryData<BudgetRequestPublic>(['budgets', variables.id]);
      queryClient.setQueryData<BudgetRequestPublic>(['budgets', variables.id], (old) => {
        if (!old) return old;
        return { ...old, status: variables.status as BudgetStatus };
      });
      return { previous };
    },

    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['budgets', variables.id], context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
