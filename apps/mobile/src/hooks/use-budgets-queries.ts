/**
 * Mobile budget queries. Web equivalent: apps/web/src/hooks/use-budgets-queries.ts
 *
 * Split from mutations so neither file exceeds 150 LOC. See ADR-012 + the
 * eslint max-lines rule on apps/mobile/src/hooks/.
 */
import type { BudgetRequestPublic } from '@epde/shared';
import { QUERY_KEYS, STALE_TIME } from '@epde/shared';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import {
  type BudgetFilters,
  getBudget,
  getBudgetAuditLog,
  getBudgetComments,
  getBudgets,
} from '@/lib/api/budgets';

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

export function useBudgetAuditLog(budgetId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.budgets, budgetId, QUERY_KEYS.budgetAuditLog],
    queryFn: ({ signal }) => getBudgetAuditLog(budgetId, signal).then((r) => r.data),
    enabled: !!budgetId,
    staleTime: STALE_TIME.SLOW,
  });
}

export function useBudgetComments(budgetId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.budgets, budgetId, QUERY_KEYS.budgetComments],
    queryFn: ({ signal }) => getBudgetComments(budgetId, signal).then((r) => r.data),
    enabled: !!budgetId,
    staleTime: STALE_TIME.VOLATILE,
  });
}
