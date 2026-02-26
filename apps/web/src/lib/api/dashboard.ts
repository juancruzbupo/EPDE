import { createDashboardQueries } from '@epde/shared/api';
import { apiClient } from '../api-client';
import type { ApiResponse, DashboardStats, ActivityItem } from '@epde/shared';

const queries = createDashboardQueries(apiClient);
export const { getClientDashboardStats, getClientUpcomingTasks } = queries;

// Admin-only
export async function getDashboardStats(
  signal?: AbortSignal,
): Promise<ApiResponse<DashboardStats>> {
  const { data } = await apiClient.get('/dashboard/stats', { signal });
  return data;
}

export async function getDashboardActivity(
  signal?: AbortSignal,
): Promise<ApiResponse<ActivityItem[]>> {
  const { data } = await apiClient.get('/dashboard/activity', { signal });
  return data;
}
