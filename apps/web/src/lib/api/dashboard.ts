import { apiClient } from '../api-client';
import type {
  ApiResponse,
  DashboardStats,
  ActivityItem,
  ClientDashboardStats,
  UpcomingTask,
} from '@epde/shared';

export async function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  const { data } = await apiClient.get('/dashboard/stats');
  return data;
}

export async function getDashboardActivity(): Promise<ApiResponse<ActivityItem[]>> {
  const { data } = await apiClient.get('/dashboard/activity');
  return data;
}

export async function getClientDashboardStats(): Promise<ApiResponse<ClientDashboardStats>> {
  const { data } = await apiClient.get('/dashboard/client-stats');
  return data;
}

export async function getClientUpcomingTasks(): Promise<ApiResponse<UpcomingTask[]>> {
  const { data } = await apiClient.get('/dashboard/client-upcoming');
  return data;
}
