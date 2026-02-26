import type { AxiosInstance } from 'axios';
import type { PaginatedResponse, ApiResponse, BudgetRequestPublic } from '../types';

export interface BudgetFilters {
  status?: string;
  propertyId?: string;
  cursor?: string;
  take?: number;
}

export function createBudgetQueries(apiClient: AxiosInstance) {
  return {
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

    async createBudgetRequest(dto: { propertyId: string; title: string; description?: string }) {
      const { data } = await apiClient.post('/budgets', dto);
      return data;
    },

    async updateBudgetStatus(id: string, status: string) {
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
    ) {
      const { data } = await apiClient.post(`/budgets/${id}/respond`, dto);
      return data;
    },
  };
}
