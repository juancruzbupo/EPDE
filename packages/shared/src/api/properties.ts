import type { AxiosInstance } from 'axios';

import type { ApiResponse, PaginatedResponse, PropertyPublic } from '../types';
import type { PropertyType } from '../types/enums';

export interface PropertyFilters {
  search?: string;
  city?: string;
  type?: PropertyType;
  userId?: string;
  cursor?: string;
  take?: number;
}

/**
 * Creates query functions for client properties.
 * @param apiClient Axios instance (web uses proxy `/api/v1`, mobile uses direct URL)
 */
export function createPropertyQueries(apiClient: AxiosInstance) {
  return {
    // --- Queries ---

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

    async getPropertyExpenses(
      id: string,
      signal?: AbortSignal,
    ): Promise<
      ApiResponse<{
        totalCost: number;
        items: {
          date: string;
          description: string;
          category: string | null;
          sector: string | null;
          amount: number;
          type: 'task' | 'budget';
        }[];
      }>
    > {
      const { data } = await apiClient.get(`/properties/${id}/expenses`, { signal });
      return data;
    },

    async getPropertyPhotos(
      id: string,
      signal?: AbortSignal,
    ): Promise<
      ApiResponse<
        {
          url: string;
          date: string;
          description: string;
          source: 'service-request' | 'task';
        }[]
      >
    > {
      const { data } = await apiClient.get(`/properties/${id}/photos`, { signal });
      return data;
    },
  };
}
