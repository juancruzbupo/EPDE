import type { AxiosInstance } from 'axios';
import type { PaginatedResponse, ApiResponse, PropertyPublic } from '../types';

export interface PropertyFilters {
  search?: string;
  city?: string;
  type?: string;
  userId?: string;
  cursor?: string;
  take?: number;
}

export function createPropertyQueries(apiClient: AxiosInstance) {
  return {
    async getProperties(params: PropertyFilters): Promise<PaginatedResponse<PropertyPublic>> {
      const { data } = await apiClient.get('/properties', { params });
      return data;
    },

    async getProperty(id: string): Promise<ApiResponse<PropertyPublic>> {
      const { data } = await apiClient.get(`/properties/${id}`);
      return data;
    },
  };
}
