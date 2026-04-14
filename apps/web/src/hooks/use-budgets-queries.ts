import type { BudgetRequestPublic } from '@epde/shared';
import { QUERY_KEYS } from '@epde/shared';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import {
  type BudgetFilters,
  getBudget,
  getBudgetAuditLog,
  getBudgetComments,
  getBudgets,
} from '@/lib/api/budgets';

import { STALE_TIME } from './query-stale-times';

export function useBudgets(filters: Omit<BudgetFilters, 'cursor'>) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.budgets, filters],
    queryFn: ({ pageParam, signal }) => getBudgets({ ...filters, cursor: pageParam }, signal),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    maxPages: 10,
    staleTime: STALE_TIME.VOLATILE,
  });
}

export function useBudget(id: string, options?: { initialData?: BudgetRequestPublic }) {
  return useQuery({
    queryKey: [QUERY_KEYS.budgets, id],
    queryFn: ({ signal }) => getBudget(id, signal).then((r) => r.data),
    initialData: options?.initialData,
    enabled: !!id,
    staleTime: STALE_TIME.VOLATILE,
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
    staleTime: STALE_TIME.MEDIUM,
  });
}
