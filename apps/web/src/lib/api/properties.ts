import { apiClient } from '../api-client';
import type { PaginatedResponse, ApiResponse, PropertyPublic } from '@epde/shared';

export type { PropertyPublic };

export interface PropertyFilters {
  search?: string;
  userId?: string;
  city?: string;
  type?: string;
  cursor?: string;
  take?: number;
}

export async function getProperties(
  params: PropertyFilters,
): Promise<PaginatedResponse<PropertyPublic>> {
  const { data } = await apiClient.get('/properties', { params });
  return data;
}

export async function getProperty(id: string): Promise<ApiResponse<PropertyPublic>> {
  const { data } = await apiClient.get(`/properties/${id}`);
  return data;
}

export async function createProperty(dto: {
  userId: string;
  address: string;
  city: string;
  type?: string;
  yearBuilt?: number;
  squareMeters?: number;
}) {
  const { data } = await apiClient.post('/properties', dto);
  return data;
}

export async function updateProperty(id: string, dto: Record<string, unknown>) {
  const { data } = await apiClient.patch(`/properties/${id}`, dto);
  return data;
}

export async function deleteProperty(id: string) {
  const { data } = await apiClient.delete(`/properties/${id}`);
  return data;
}
