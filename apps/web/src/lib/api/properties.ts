import type { ApiResponse, PropertyPublic, PropertyType, UpdatePropertyInput } from '@epde/shared';
import { createPropertyQueries } from '@epde/shared';

import { apiClient } from '../api-client';

export type { PropertyFilters, PropertyPublic } from '@epde/shared';

const queries = createPropertyQueries(apiClient);
export const { getProperties, getProperty, getPropertyExpenses } = queries;

// Admin-only
export async function createProperty(dto: {
  userId: string;
  address: string;
  city: string;
  type?: PropertyType;
  yearBuilt?: number;
  squareMeters?: number;
}): Promise<ApiResponse<PropertyPublic>> {
  const { data } = await apiClient.post('/properties', dto);
  return data;
}

export async function updateProperty(
  id: string,
  dto: UpdatePropertyInput,
): Promise<ApiResponse<PropertyPublic>> {
  const { data } = await apiClient.patch(`/properties/${id}`, dto);
  return data;
}

export async function deleteProperty(id: string): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete(`/properties/${id}`);
  return data;
}
