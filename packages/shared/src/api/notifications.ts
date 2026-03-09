import type { AxiosInstance } from 'axios';

import type { ApiResponse, NotificationPublic, PaginatedResponse } from '../types';

export interface NotificationFilters {
  cursor?: string;
  take?: number;
}

/**
 * Creates query and mutation functions for user notifications.
 * @param apiClient Axios instance (web uses proxy `/api/v1`, mobile uses direct URL)
 */
export function createNotificationQueries(apiClient: AxiosInstance) {
  return {
    // --- Queries ---

    async getNotifications(
      params: NotificationFilters = {},
      signal?: AbortSignal,
    ): Promise<PaginatedResponse<NotificationPublic>> {
      const { data } = await apiClient.get('/notifications', { params, signal });
      return data;
    },

    async getUnreadCount(signal?: AbortSignal): Promise<ApiResponse<{ count: number }>> {
      const { data } = await apiClient.get('/notifications/unread-count', { signal });
      return data;
    },

    // --- Mutations ---

    async markAsRead(id: string): Promise<ApiResponse<NotificationPublic>> {
      const { data } = await apiClient.patch(`/notifications/${id}/read`);
      return data;
    },

    async markAllAsRead(): Promise<ApiResponse<{ count: number }>> {
      const { data } = await apiClient.patch('/notifications/read-all');
      return data;
    },
  };
}
