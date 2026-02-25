import { apiClient } from '../api-client';
import type { PaginatedResponse, ApiResponse, BudgetRequestPublic } from '@epde/shared';

export type { BudgetRequestPublic };

export interface BudgetFilters {
  status?: string;
  propertyId?: string;
  cursor?: string;
  take?: number;
}

export async function getBudgets(
  params: BudgetFilters,
): Promise<PaginatedResponse<BudgetRequestPublic>> {
  const { data } = await apiClient.get('/budgets', { params });
  return data;
}

export async function getBudget(id: string): Promise<ApiResponse<BudgetRequestPublic>> {
  const { data } = await apiClient.get(`/budgets/${id}`);
  return data;
}

export async function createBudgetRequest(dto: {
  propertyId: string;
  title: string;
  description?: string;
}) {
  const { data } = await apiClient.post('/budgets', dto);
  return data;
}

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

export async function updateBudgetStatus(id: string, status: string) {
  const { data } = await apiClient.patch(`/budgets/${id}/status`, { status });
  return data;
}
