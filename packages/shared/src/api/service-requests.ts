import type { AxiosInstance } from 'axios';
import type { PaginatedResponse, ApiResponse, ServiceRequestPublic } from '../types';
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
  };
}
