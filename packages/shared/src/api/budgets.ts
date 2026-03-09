import type { AxiosInstance } from 'axios';

import type { ApiResponse, BudgetRequestPublic, PaginatedResponse } from '../types';
import type { BudgetStatus } from '../types/enums';

export interface BudgetFilters {
  status?: BudgetStatus;
  propertyId?: string;
  cursor?: string;
  take?: number;
}

/**
 * Creates query and mutation functions for budget requests.
 * @param apiClient Axios instance (web uses proxy `/api/v1`, mobile uses direct URL)
 */
export function createBudgetQueries(apiClient: AxiosInstance) {
  return {
    // --- Queries ---

    async getBudgets(
      params: BudgetFilters,
      signal?: AbortSignal,
    ): Promise<PaginatedResponse<BudgetRequestPublic>> {
      const { data } = await apiClient.get('/budgets', { params, signal });
      return data;
    },

    async getBudget(id: string, signal?: AbortSignal): Promise<ApiResponse<BudgetRequestPublic>> {
      const { data } = await apiClient.get(`/budgets/${id}`, { signal });
      return data;
    },

    // --- Mutations ---

    async createBudgetRequest(dto: {
      propertyId: string;
      title: string;
      description?: string;
    }): Promise<ApiResponse<BudgetRequestPublic>> {
      const { data } = await apiClient.post('/budgets', dto);
      return data;
    },

    async updateBudgetStatus(
      id: string,
      status: BudgetStatus,
    ): Promise<ApiResponse<BudgetRequestPublic>> {
      const { data } = await apiClient.patch(`/budgets/${id}/status`, { status });
      return data;
    },

    async respondToBudget(
      id: string,
      dto: {
        lineItems: { description: string; quantity: number; unitPrice: number }[];
        estimatedDays?: number;
        notes?: string;
        validUntil?: string;
      },
    ): Promise<ApiResponse<BudgetRequestPublic>> {
      const { data } = await apiClient.post(`/budgets/${id}/respond`, dto);
      return data;
    },
  };
}
