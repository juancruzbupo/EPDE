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
    async getBudgets(params: BudgetFilters): Promise<PaginatedResponse<BudgetRequestPublic>> {
      const { data } = await apiClient.get('/budgets', { params });
      return data;
    },

    async getBudget(id: string): Promise<ApiResponse<BudgetRequestPublic>> {
      const { data } = await apiClient.get(`/budgets/${id}`);
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
  };
}
