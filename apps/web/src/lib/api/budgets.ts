import { createBudgetQueries } from '@epde/shared/api';
import { apiClient } from '../api-client';

export type { BudgetFilters } from '@epde/shared/api';
export type { BudgetRequestPublic } from '@epde/shared';

const queries = createBudgetQueries(apiClient);
export const { getBudgets, getBudget, createBudgetRequest, updateBudgetStatus } = queries;

// Admin-only
export async function respondToBudget(
  id: string,
  dto: {
    lineItems: { description: string; quantity: number; unitPrice: number }[];
    estimatedDays?: number;
    notes?: string;
    validUntil?: string;
  },
) {
  const { data } = await apiClient.post(`/budgets/${id}/respond`, dto);
  return data;
}
