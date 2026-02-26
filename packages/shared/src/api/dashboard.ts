import type { AxiosInstance } from 'axios';
import type { ApiResponse, ClientDashboardStats, UpcomingTask } from '../types';

export function createDashboardQueries(apiClient: AxiosInstance) {
  return {
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
