import { apiClient } from '../api-client';
import type { PaginatedResponse, ApiResponse, ServiceRequestPublic } from '@epde/shared';

export type { ServiceRequestPublic };

export interface ServiceRequestFilters {
  status?: string;
  urgency?: string;
  propertyId?: string;
  cursor?: string;
  take?: number;
}

export async function getServiceRequests(
  params: ServiceRequestFilters,
): Promise<PaginatedResponse<ServiceRequestPublic>> {
  const { data } = await apiClient.get('/service-requests', { params });
  return data;
}

export async function getServiceRequest(id: string): Promise<ApiResponse<ServiceRequestPublic>> {
  const { data } = await apiClient.get(`/service-requests/${id}`);
  return data;
}

export async function createServiceRequest(dto: {
  propertyId: string;
  title: string;
  description: string;
  urgency?: string;
  photoUrls?: string[];
}) {
  const { data } = await apiClient.post('/service-requests', dto);
  return data;
}

export async function updateServiceStatus(id: string, status: string) {
  const { data } = await apiClient.patch(`/service-requests/${id}/status`, { status });
  return data;
}
