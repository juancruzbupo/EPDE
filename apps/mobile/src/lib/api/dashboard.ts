import { apiClient } from '../api-client';
import type { ApiResponse, ClientDashboardStats, UpcomingTask } from '@epde/shared/types';

export async function getClientDashboardStats(): Promise<ApiResponse<ClientDashboardStats>> {
  const { data } = await apiClient.get('/dashboard/client-stats');
  return data;
}

export async function getClientUpcomingTasks(): Promise<ApiResponse<UpcomingTask[]>> {
  const { data } = await apiClient.get('/dashboard/client-upcoming');
  return data;
}
