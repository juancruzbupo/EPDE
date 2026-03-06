import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import type { BudgetRequestPublic } from '@epde/shared';
import { invalidateDashboard } from '@/lib/invalidate-dashboard';
import {
  getBudgets,
  getBudget,
  createBudgetRequest,
  respondToBudget,
  updateBudgetStatus,
  type BudgetFilters,
} from '@/lib/api/budgets';

export function useBudgets(filters: Omit<BudgetFilters, 'cursor'>) {
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
      toast.success('Presupuesto creado');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.budgets] });
      invalidateDashboard(queryClient);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al crear presupuesto'));
    },
  });
}

export function useRespondToBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...dto
    }: {
      id: string;
      lineItems: { description: string; quantity: number; unitPrice: number }[];
      estimatedDays?: number;
      notes?: string;
      validUntil?: string;
    }) => respondToBudget(id, dto),
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
    mutationFn: ({ id, status }: { id: string; status: string }) => updateBudgetStatus(id, status),
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.budgets] });
      invalidateDashboard(queryClient);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al actualizar estado'));
    },
  });
}
