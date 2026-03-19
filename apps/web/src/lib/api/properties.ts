import type {
  ApiResponse,
  PropertyPublic,
  PropertyReportData,
  PropertyType,
  UpdatePropertyInput,
} from '@epde/shared';
import { createPropertyQueries } from '@epde/shared';

import { apiClient } from '../api-client';

export type { PropertyFilters, PropertyPublic } from '@epde/shared';

const queries = createPropertyQueries(apiClient);
export const {
  getProperties,
  getProperty,
  getPropertyExpenses,
  getPropertyPhotos,
  getPropertyHealthIndex,
  getPropertyHealthHistory,
} = queries;

export async function getPropertyReport(
  id: string,
  signal?: AbortSignal,
): Promise<{ data: PropertyReportData }> {
  const { data } = await apiClient.get<{ data: PropertyReportData }>(
    `/properties/${id}/report-data`,
    { signal },
  );
  return data;
}

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
