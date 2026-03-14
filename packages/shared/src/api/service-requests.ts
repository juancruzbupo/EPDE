import type { AxiosInstance } from 'axios';

import type {
  AddServiceRequestAttachmentsInput,
  CreateServiceRequestCommentInput,
  EditServiceRequestInput,
} from '../schemas/service-request';
import type {
  ApiResponse,
  PaginatedResponse,
  ServiceRequestAttachmentPublic,
  ServiceRequestAuditLogPublic,
  ServiceRequestCommentPublic,
  ServiceRequestPublic,
} from '../types';
import type { ServiceStatus, ServiceUrgency } from '../types/enums';

export interface ServiceRequestFilters {
  status?: ServiceStatus;
  urgency?: ServiceUrgency;
  propertyId?: string;
  cursor?: string;
  take?: number;
}

/**
 * Creates query and mutation functions for service requests.
 * @param apiClient Axios instance (web uses proxy `/api/v1`, mobile uses direct URL)
 */
export function createServiceRequestQueries(apiClient: AxiosInstance) {
  return {
    // --- Queries ---

    async getServiceRequests(
      params: ServiceRequestFilters,
      signal?: AbortSignal,
    ): Promise<PaginatedResponse<ServiceRequestPublic>> {
      const { data } = await apiClient.get('/service-requests', { params, signal });
      return data;
    },

    async getServiceRequest(
      id: string,
      signal?: AbortSignal,
    ): Promise<ApiResponse<ServiceRequestPublic>> {
      const { data } = await apiClient.get(`/service-requests/${id}`, { signal });
      return data;
    },

    // --- Mutations ---

    async createServiceRequest(dto: {
      propertyId: string;
      title: string;
      description: string;
      urgency?: ServiceUrgency;
      photoUrls?: string[];
    }): Promise<ApiResponse<ServiceRequestPublic>> {
      const { data } = await apiClient.post('/service-requests', dto);
      return data;
    },

    async editServiceRequest(
      id: string,
      dto: EditServiceRequestInput,
    ): Promise<ApiResponse<ServiceRequestPublic>> {
      const { data } = await apiClient.patch(`/service-requests/${id}`, dto);
      return data;
    },

    // --- Audit Log ---

    async getServiceRequestAuditLog(
      id: string,
      signal?: AbortSignal,
    ): Promise<ApiResponse<ServiceRequestAuditLogPublic[]>> {
      const { data } = await apiClient.get(`/service-requests/${id}/audit-log`, { signal });
      return data;
    },

    // --- Comments ---

    async getServiceRequestComments(
      id: string,
      signal?: AbortSignal,
    ): Promise<ApiResponse<ServiceRequestCommentPublic[]>> {
      const { data } = await apiClient.get(`/service-requests/${id}/comments`, { signal });
      return data;
    },

    async createServiceRequestComment(
      id: string,
      dto: CreateServiceRequestCommentInput,
    ): Promise<ApiResponse<ServiceRequestCommentPublic>> {
      const { data } = await apiClient.post(`/service-requests/${id}/comments`, dto);
      return data;
    },

    // --- Attachments ---

    async addServiceRequestAttachments(
      id: string,
      dto: AddServiceRequestAttachmentsInput,
    ): Promise<ApiResponse<ServiceRequestAttachmentPublic[]>> {
      const { data } = await apiClient.post(`/service-requests/${id}/attachments`, dto);
      return data;
    },
  };
}
