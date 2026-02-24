import { apiClient } from '../api-client';
import type { PaginatedResponse } from '@epde/shared';

export interface NotificationPublic {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data: Record<string, unknown> | null;
  createdAt: string;
}

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
