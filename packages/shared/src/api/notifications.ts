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
    ): Promise<PaginatedResponse<NotificationPublic>> {
      const { data } = await apiClient.get('/notifications', { params });
      return data;
    },

    async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
      const { data } = await apiClient.get('/notifications/unread-count');
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
