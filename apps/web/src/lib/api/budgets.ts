import { apiClient } from '../api-client';
import type { PaginatedResponse, ApiResponse } from '@epde/shared';

export interface BudgetLineItemPublic {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface BudgetResponsePublic {
  id: string;
  totalAmount: number;
  estimatedDays: number | null;
  notes: string | null;
  validUntil: string | null;
  respondedAt: string;
}

export interface BudgetRequestPublic {
  id: string;
  propertyId: string;
  requestedBy: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    address: string;
    city: string;
    user: { id: string; name: string };
  };
  requester: { id: string; name: string; email: string };
  lineItems: BudgetLineItemPublic[];
  response: BudgetResponsePublic | null;
}

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
