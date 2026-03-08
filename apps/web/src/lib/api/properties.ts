import { createPropertyQueries } from '@epde/shared';
import type { ApiResponse, UpdatePropertyInput, PropertyType } from '@epde/shared';
import { apiClient } from '../api-client';

export type { PropertyFilters, PropertyPublic } from '@epde/shared';

const queries = createPropertyQueries(apiClient);
export const { getProperties, getProperty } = queries;

// Admin-only
export async function createProperty(dto: {
  userId: string;
  address: string;
  city: string;
  type?: PropertyType;
  yearBuilt?: number;
  squareMeters?: number;
}): Promise<ApiResponse<unknown>> {
  const { data } = await apiClient.post('/properties', dto);
  return data;
}

export async function updateProperty(
  id: string,
  dto: UpdatePropertyInput,
): Promise<ApiResponse<unknown>> {
  const { data } = await apiClient.patch(`/properties/${id}`, dto);
  return data;
}

export async function deleteProperty(id: string): Promise<ApiResponse<unknown>> {
  const { data } = await apiClient.delete(`/properties/${id}`);
  return data;
}
