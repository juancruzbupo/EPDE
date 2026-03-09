import type { AxiosInstance } from 'axios';

import type { ApiResponse, ClientDashboardStats, UpcomingTask } from '../types';

/**
 * Creates query functions for the client dashboard.
 * @param apiClient Axios instance (web uses proxy `/api/v1`, mobile uses direct URL)
 */
export function createDashboardQueries(apiClient: AxiosInstance) {
  return {
    // --- Queries ---

    async getClientDashboardStats(
      signal?: AbortSignal,
    ): Promise<ApiResponse<ClientDashboardStats>> {
      const { data } = await apiClient.get('/dashboard/client-stats', { signal });
      return data;
    },

    async getClientUpcomingTasks(signal?: AbortSignal): Promise<ApiResponse<UpcomingTask[]>> {
      const { data } = await apiClient.get('/dashboard/client-upcoming', { signal });
      return data;
    },
  };
}
