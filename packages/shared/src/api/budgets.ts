import type { AxiosInstance } from 'axios';

import type {
  AddBudgetAttachmentsInput,
  CreateBudgetCommentInput,
  EditBudgetRequestInput,
  RespondBudgetInput,
} from '../schemas/budget';
import type {
  ApiResponse,
  BudgetAttachmentPublic,
  BudgetAuditLogPublic,
  BudgetCommentPublic,
  BudgetRequestPublic,
  PaginatedResponse,
} from '../types';
import type { BudgetStatus } from '../types/enums';

export interface BudgetFilters {
  status?: BudgetStatus;
  propertyId?: string;
  search?: string;
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
      dto: RespondBudgetInput,
    ): Promise<ApiResponse<BudgetRequestPublic>> {
      const { data } = await apiClient.post(`/budgets/${id}/respond`, dto);
      return data;
    },

    async editBudgetRequest(
      id: string,
      dto: EditBudgetRequestInput,
    ): Promise<ApiResponse<BudgetRequestPublic>> {
      const { data } = await apiClient.patch(`/budgets/${id}`, dto);
      return data;
    },

    async getBudgetAuditLog(
      id: string,
      signal?: AbortSignal,
    ): Promise<ApiResponse<BudgetAuditLogPublic[]>> {
      const { data } = await apiClient.get(`/budgets/${id}/audit-log`, { signal });
      return data;
    },

    async getBudgetComments(
      id: string,
      signal?: AbortSignal,
    ): Promise<ApiResponse<BudgetCommentPublic[]>> {
      const { data } = await apiClient.get(`/budgets/${id}/comments`, { signal });
      return data;
    },

    async createBudgetComment(
      id: string,
      dto: CreateBudgetCommentInput,
    ): Promise<ApiResponse<BudgetCommentPublic>> {
      const { data } = await apiClient.post(`/budgets/${id}/comments`, dto);
      return data;
    },

    async addBudgetAttachments(
      id: string,
      dto: AddBudgetAttachmentsInput,
    ): Promise<ApiResponse<BudgetAttachmentPublic[]>> {
      const { data } = await apiClient.post(`/budgets/${id}/attachments`, dto);
      return data;
    },
  };
}
