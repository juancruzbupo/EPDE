import type { AxiosInstance } from 'axios';

import type {
  ActivityItem,
  AdminAnalytics,
  ApiResponse,
  ClientAnalytics,
  ClientDashboardStats,
  DashboardStats,
  UpcomingTask,
} from '../types';

/**
 * Creates query functions for both client and admin dashboards. Admin reads
 * are currently web-only consumers; exposing them via the factory keeps the
 * door open for an eventual mobile admin (ADR-015) without re-writing the
 * API surface, and satisfies ADR-020 (reads must come from factories).
 *
 * @param apiClient Axios instance (web uses proxy `/api/v1`, mobile uses direct URL)
 */
export function createDashboardQueries(apiClient: AxiosInstance) {
  return {
    // --- Client queries ---

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

    async getClientAnalytics(
      signal?: AbortSignal,
      months?: number,
    ): Promise<ApiResponse<ClientAnalytics>> {
      const params = months ? `?months=${months}` : '';
      const { data } = await apiClient.get(`/dashboard/client-analytics${params}`, { signal });
      return data;
    },

    // --- Admin queries ---

    async getDashboardStats(signal?: AbortSignal): Promise<ApiResponse<DashboardStats>> {
      const { data } = await apiClient.get('/dashboard/stats', { signal });
      return data;
    },

    async getDashboardActivity(signal?: AbortSignal): Promise<ApiResponse<ActivityItem[]>> {
      const { data } = await apiClient.get('/dashboard/activity', { signal });
      return data;
    },

    async getAdminAnalytics(
      signal?: AbortSignal,
      months?: number,
    ): Promise<ApiResponse<AdminAnalytics>> {
      const { data } = await apiClient.get('/dashboard/analytics', {
        params: months ? { months } : undefined,
        signal,
      });
      return data;
    },
  };
}
