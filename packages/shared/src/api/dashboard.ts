import type { AxiosInstance } from 'axios';
import type { ApiResponse, ClientDashboardStats, UpcomingTask } from '../types';

export function createDashboardQueries(apiClient: AxiosInstance) {
  return {
    async getClientDashboardStats(): Promise<ApiResponse<ClientDashboardStats>> {
      const { data } = await apiClient.get('/dashboard/client-stats');
      return data;
    },

    async getClientUpcomingTasks(): Promise<ApiResponse<UpcomingTask[]>> {
      const { data } = await apiClient.get('/dashboard/client-upcoming');
      return data;
    },
  };
}
