import { createPropertyQueries } from '@epde/shared/api';
import { apiClient } from '../api-client';
import type { UpdatePropertyInput } from '@epde/shared';

export type { PropertyFilters } from '@epde/shared/api';
export type { PropertyPublic } from '@epde/shared';

const queries = createPropertyQueries(apiClient);
export const { getProperties, getProperty } = queries;

// Admin-only
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

export async function updateProperty(id: string, dto: UpdatePropertyInput) {
  const { data } = await apiClient.patch(`/properties/${id}`, dto);
  return data;
}

export async function deleteProperty(id: string) {
  const { data } = await apiClient.delete(`/properties/${id}`);
  return data;
}
