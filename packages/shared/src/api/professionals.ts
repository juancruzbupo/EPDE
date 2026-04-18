import type { AxiosInstance } from 'axios';

import type {
  ApiResponse,
  CreateAssignmentInput,
  CreateAttachmentInput,
  CreatePaymentInput,
  CreateProfessionalInput,
  CreateRatingInput,
  CreateTagInput,
  CreateTimelineNoteInput,
  PaginatedResponse,
  ProfessionalAttachmentPublic,
  ProfessionalDetailPublic,
  ProfessionalFilters,
  ProfessionalPaymentPublic,
  ProfessionalPublic,
  ProfessionalRatingPublic,
  ProfessionalSuggestion,
  ProfessionalTimelineNotePublic,
  ServiceRequestAssignmentPublic,
  SuggestedProfessionalsQuery,
  UpdateAvailabilityInput,
  UpdatePaymentStatusInput,
  UpdateProfessionalInput,
  UpdateTierInput,
} from '..';

/**
 * Creates query and mutation functions for the professionals directory.
 * Admin-only. See ADR-018.
 */
export function createProfessionalQueries(apiClient: AxiosInstance) {
  return {
    // --- Queries ---

    async getProfessionals(
      params: ProfessionalFilters,
      signal?: AbortSignal,
    ): Promise<PaginatedResponse<ProfessionalPublic>> {
      const { data } = await apiClient.get('/professionals', { params, signal });
      return data;
    },

    async getProfessional(
      id: string,
      signal?: AbortSignal,
    ): Promise<ApiResponse<ProfessionalDetailPublic>> {
      const { data } = await apiClient.get(`/professionals/${id}`, { signal });
      return data;
    },

    async getProfessionalPayments(
      id: string,
      signal?: AbortSignal,
    ): Promise<ApiResponse<ProfessionalPaymentPublic[]>> {
      const { data } = await apiClient.get(`/professionals/${id}/payments`, { signal });
      return data;
    },

    async getSuggestedProfessionals(
      params: SuggestedProfessionalsQuery,
      signal?: AbortSignal,
    ): Promise<ApiResponse<ProfessionalSuggestion[]>> {
      const { data } = await apiClient.get('/professionals/suggested', { params, signal });
      return data;
    },

    // --- Mutations ---

    async createProfessional(
      dto: CreateProfessionalInput,
    ): Promise<ApiResponse<ProfessionalPublic>> {
      const { data } = await apiClient.post('/professionals', dto);
      return data;
    },

    async updateProfessional(
      id: string,
      dto: UpdateProfessionalInput,
    ): Promise<ApiResponse<ProfessionalPublic>> {
      const { data } = await apiClient.patch(`/professionals/${id}`, dto);
      return data;
    },

    async deleteProfessional(id: string): Promise<ApiResponse<null>> {
      const { data } = await apiClient.delete(`/professionals/${id}`);
      return data;
    },

    async updateTier(id: string, dto: UpdateTierInput): Promise<ApiResponse<ProfessionalPublic>> {
      const { data } = await apiClient.patch(`/professionals/${id}/tier`, dto);
      return data;
    },

    async updateAvailability(
      id: string,
      dto: UpdateAvailabilityInput,
    ): Promise<ApiResponse<ProfessionalPublic>> {
      const { data } = await apiClient.patch(`/professionals/${id}/availability`, dto);
      return data;
    },

    async createRating(
      id: string,
      dto: CreateRatingInput,
    ): Promise<ApiResponse<ProfessionalRatingPublic>> {
      const { data } = await apiClient.post(`/professionals/${id}/ratings`, dto);
      return data;
    },

    async deleteRating(id: string, ratingId: string): Promise<ApiResponse<null>> {
      const { data } = await apiClient.delete(`/professionals/${id}/ratings/${ratingId}`);
      return data;
    },

    async createTimelineNote(
      id: string,
      dto: CreateTimelineNoteInput,
    ): Promise<ApiResponse<ProfessionalTimelineNotePublic>> {
      const { data } = await apiClient.post(`/professionals/${id}/notes`, dto);
      return data;
    },

    async createTag(id: string, dto: CreateTagInput): Promise<ApiResponse<{ tag: string }>> {
      const { data } = await apiClient.post(`/professionals/${id}/tags`, dto);
      return data;
    },

    async deleteTag(id: string, tag: string): Promise<ApiResponse<null>> {
      const { data } = await apiClient.delete(
        `/professionals/${id}/tags/${encodeURIComponent(tag)}`,
      );
      return data;
    },

    async createAttachment(
      id: string,
      dto: CreateAttachmentInput,
    ): Promise<ApiResponse<ProfessionalAttachmentPublic>> {
      const { data } = await apiClient.post(`/professionals/${id}/attachments`, dto);
      return data;
    },

    async verifyAttachment(
      id: string,
      attachmentId: string,
    ): Promise<ApiResponse<ProfessionalAttachmentPublic>> {
      const { data } = await apiClient.patch(
        `/professionals/${id}/attachments/${attachmentId}/verify`,
      );
      return data;
    },

    async deleteAttachment(id: string, attachmentId: string): Promise<ApiResponse<null>> {
      const { data } = await apiClient.delete(`/professionals/${id}/attachments/${attachmentId}`);
      return data;
    },

    // --- Assignments ---

    async assignProfessional(
      serviceRequestId: string,
      dto: CreateAssignmentInput,
    ): Promise<ApiResponse<ServiceRequestAssignmentPublic>> {
      const { data } = await apiClient.post(`/service-requests/${serviceRequestId}/assign`, dto);
      return data;
    },

    async unassignProfessional(serviceRequestId: string): Promise<ApiResponse<null>> {
      const { data } = await apiClient.delete(`/service-requests/${serviceRequestId}/assign`);
      return data;
    },

    // --- Payments ---

    async createPayment(
      id: string,
      dto: CreatePaymentInput,
    ): Promise<ApiResponse<ProfessionalPaymentPublic>> {
      const { data } = await apiClient.post(`/professionals/${id}/payments`, dto);
      return data;
    },

    async updatePaymentStatus(
      paymentId: string,
      dto: UpdatePaymentStatusInput,
    ): Promise<ApiResponse<ProfessionalPaymentPublic>> {
      const { data } = await apiClient.patch(`/professional-payments/${paymentId}`, dto);
      return data;
    },
  };
}
