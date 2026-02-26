import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getBudgets,
  getBudget,
  createBudgetRequest,
  respondToBudget,
  updateBudgetStatus,
  type BudgetFilters,
} from '@/lib/api/budgets';

export function useBudgets(filters: BudgetFilters) {
  return useInfiniteQuery({
    queryKey: ['budgets', filters],
    queryFn: ({ pageParam, signal }) => getBudgets({ ...filters, cursor: pageParam }, signal),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: ['budgets', id],
    queryFn: ({ signal }) => getBudget(id, signal),
    enabled: !!id,
  });
}

export function useCreateBudgetRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBudgetRequest,
    onSuccess: () => {
      toast.success('Presupuesto creado');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'activity'] });
    },
    onError: () => {
      toast.error('Error al crear presupuesto');
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
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
    onError: () => {
      toast.error('Error al enviar cotización');
    },
  });
}

export function useUpdateBudgetStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateBudgetStatus(id, status),
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'activity'] });
    },
    onError: () => {
      toast.error('Error al actualizar estado');
    },
  });
}
