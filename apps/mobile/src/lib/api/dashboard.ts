import type { ActivityItem, AdminAnalytics, ApiResponse, DashboardStats } from '@epde/shared';
import { createDashboardQueries } from '@epde/shared';

import { apiClient } from '../api-client';

const queries = createDashboardQueries(apiClient);
export const { getClientDashboardStats, getClientUpcomingTasks, getClientAnalytics } = queries;

// ─── Admin-only API functions ───────────────────────────

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

export async function getAdminAnalytics(
  signal?: AbortSignal,
  months?: number,
): Promise<ApiResponse<AdminAnalytics>> {
  const { data } = await apiClient.get('/dashboard/analytics', {
    params: months ? { months } : undefined,
    signal,
  });
  return data;
}
