import { apiClient } from '../api-client';
import type { PaginatedResponse, ApiResponse, NotificationPublic } from '@epde/shared/types';

export interface NotificationParams {
  cursor?: string;
  take?: number;
}

export async function getNotifications(
  params: NotificationParams = {},
): Promise<PaginatedResponse<NotificationPublic>> {
  const { data } = await apiClient.get('/notifications', { params });
  return data;
}

export async function getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
  const { data } = await apiClient.get('/notifications/unread-count');
  return data;
}

export async function markAsRead(id: string) {
  const { data } = await apiClient.patch(`/notifications/${id}/read`);
  return data;
}

export async function markAllAsRead() {
  const { data } = await apiClient.patch('/notifications/read-all');
  return data;
}
