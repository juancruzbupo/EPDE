import { apiClient } from '../api-client';
import type { PaginatedResponse, ApiResponse, PropertyPublic } from '@epde/shared/types';

export interface PropertyFilters {
  search?: string;
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
