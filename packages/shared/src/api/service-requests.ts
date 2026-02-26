import type { AxiosInstance } from 'axios';
import type { PaginatedResponse, ApiResponse, ServiceRequestPublic } from '../types';

export interface ServiceRequestFilters {
  status?: string;
  urgency?: string;
  propertyId?: string;
  cursor?: string;
  take?: number;
}

export function createServiceRequestQueries(apiClient: AxiosInstance) {
  return {
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

    async createServiceRequest(dto: {
      propertyId: string;
      title: string;
      description: string;
      urgency?: string;
      photoUrls?: string[];
    }) {
      const { data } = await apiClient.post('/service-requests', dto);
      return data;
    },
  };
}
