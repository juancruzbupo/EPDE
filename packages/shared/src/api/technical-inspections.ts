import type { AxiosInstance } from 'axios';

import type {
  ApiResponse,
  CreateTechnicalInspectionInput,
  MarkInspectionPaidInput,
  PaginatedResponse,
  ScheduleInspectionInput,
  TechnicalInspectionFilters,
  TechnicalInspectionPublic,
  UpdateInspectionStatusInput,
  UploadDeliverableInput,
} from '..';

/**
 * Creates query + mutation functions for technical inspections.
 * Admin-only for mutations; clients can create + read their own.
 */
export function createTechnicalInspectionQueries(apiClient: AxiosInstance) {
  return {
    async getTechnicalInspections(
      params: TechnicalInspectionFilters,
      signal?: AbortSignal,
    ): Promise<PaginatedResponse<TechnicalInspectionPublic>> {
      const { data } = await apiClient.get('/technical-inspections', { params, signal });
      return data;
    },

    async getTechnicalInspection(
      id: string,
      signal?: AbortSignal,
    ): Promise<ApiResponse<TechnicalInspectionPublic>> {
      const { data } = await apiClient.get(`/technical-inspections/${id}`, { signal });
      return data;
    },

    async createTechnicalInspection(
      dto: CreateTechnicalInspectionInput,
    ): Promise<ApiResponse<TechnicalInspectionPublic>> {
      const { data } = await apiClient.post('/technical-inspections', dto);
      return data;
    },

    async scheduleTechnicalInspection(
      id: string,
      dto: ScheduleInspectionInput,
    ): Promise<ApiResponse<TechnicalInspectionPublic>> {
      const { data } = await apiClient.patch(`/technical-inspections/${id}/schedule`, dto);
      return data;
    },

    async updateTechnicalInspectionStatus(
      id: string,
      dto: UpdateInspectionStatusInput,
    ): Promise<ApiResponse<TechnicalInspectionPublic>> {
      const { data } = await apiClient.patch(`/technical-inspections/${id}/status`, dto);
      return data;
    },

    async uploadTechnicalInspectionDeliverable(
      id: string,
      dto: UploadDeliverableInput,
    ): Promise<ApiResponse<TechnicalInspectionPublic>> {
      const { data } = await apiClient.post(`/technical-inspections/${id}/deliverable`, dto);
      return data;
    },

    async markTechnicalInspectionPaid(
      id: string,
      dto: MarkInspectionPaidInput,
    ): Promise<ApiResponse<TechnicalInspectionPublic>> {
      const { data } = await apiClient.post(`/technical-inspections/${id}/mark-paid`, dto);
      return data;
    },

    async cancelTechnicalInspection(id: string): Promise<ApiResponse<null>> {
      const { data } = await apiClient.delete(`/technical-inspections/${id}`);
      return data;
    },
  };
}
