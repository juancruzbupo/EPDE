import { apiClient } from '../api-client';
import type { PaginatedResponse, NotificationPublic } from '@epde/shared';

export type { NotificationPublic };

export async function getNotifications(params?: {
  cursor?: string;
  take?: number;
}): Promise<PaginatedResponse<NotificationPublic>> {
  const { data } = await apiClient.get('/notifications', { params });
  return data;
}

export async function getUnreadCount(): Promise<{ data: { count: number } }> {
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
