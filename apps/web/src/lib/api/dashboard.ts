import { apiClient } from '../api-client';
import type { ApiResponse, DashboardStats, ActivityItem } from '@epde/shared';

export async function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  const { data } = await apiClient.get('/dashboard/stats');
  return data;
}

export async function getDashboardActivity(): Promise<ApiResponse<ActivityItem[]>> {
  const { data } = await apiClient.get('/dashboard/activity');
  return data;
}
