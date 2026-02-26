import type { AxiosInstance } from 'axios';
import type { PaginatedResponse, ApiResponse, NotificationPublic } from '../types';

export interface NotificationFilters {
  cursor?: string;
  take?: number;
}

export function createNotificationQueries(apiClient: AxiosInstance) {
  return {
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

    async markAsRead(id: string) {
      const { data } = await apiClient.patch(`/notifications/${id}/read`);
      return data;
    },

    async markAllAsRead() {
      const { data } = await apiClient.patch('/notifications/read-all');
      return data;
    },
  };
}
