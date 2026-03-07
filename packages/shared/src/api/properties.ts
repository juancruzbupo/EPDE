import type { AxiosInstance } from 'axios';
import type { PaginatedResponse, ApiResponse, PropertyPublic } from '../types';
import type { PropertyType } from '../types/enums';

export interface PropertyFilters {
  search?: string;
  city?: string;
  type?: PropertyType;
  userId?: string;
  cursor?: string;
  take?: number;
}

export function createPropertyQueries(apiClient: AxiosInstance) {
  return {
    async getProperties(
      params: PropertyFilters,
      signal?: AbortSignal,
    ): Promise<PaginatedResponse<PropertyPublic>> {
      const { data } = await apiClient.get('/properties', { params, signal });
      return data;
    },

    async getProperty(id: string, signal?: AbortSignal): Promise<ApiResponse<PropertyPublic>> {
      const { data } = await apiClient.get(`/properties/${id}`, { signal });
      return data;
    },
  };
}
