import type { ApiResponse, PlanPublic, PlanStatus } from '@epde/shared';
import { createMaintenancePlanQueries } from '@epde/shared';

import { apiClient } from '../api-client';

export type { PlanListItem, TaskListItem } from '@epde/shared';
const queries = createMaintenancePlanQueries(apiClient);
export const {
  getPlans,
  getAllTasks,
  getPlan,
  getTaskDetail,
  getTaskLogs,
  getTaskNotes,
  completeTask,
  addTaskNote,
} = queries;

// Admin-only
export async function updatePlan(
  id: string,
  dto: { name?: string; status?: PlanStatus },
): Promise<ApiResponse<PlanPublic>> {
  const { data } = await apiClient.patch(`/maintenance-plans/${id}`, dto);
  return data;
}
