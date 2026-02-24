import { apiClient } from '../api-client';
import type { PaginatedResponse, ApiResponse } from '@epde/shared';

export interface ServiceRequestPhotoPublic {
  id: string;
  url: string;
  createdAt: string;
}

export interface ServiceRequestPublic {
  id: string;
  propertyId: string;
  requestedBy: string;
  title: string;
  description: string;
  urgency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    address: string;
    city: string;
    user: { id: string; name: string };
  };
  requester: { id: string; name: string; email: string };
  photos: ServiceRequestPhotoPublic[];
}

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
