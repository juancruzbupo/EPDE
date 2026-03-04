import { createMaintenancePlanQueries } from '@epde/shared/api';
import { apiClient } from '../api-client';

export type { PlanListItem, TaskListItem } from '@epde/shared';

const queries = createMaintenancePlanQueries(apiClient);
export const { getPlan, getTaskDetail, getTaskLogs, getTaskNotes, completeTask, addTaskNote } =
  queries;

export async function getPlans(): Promise<{ data: PlanListItem[] }> {
  const { data } = await apiClient.get('/maintenance-plans');
  return data;
}

export async function getAllTasks(status?: string): Promise<{ data: TaskListItem[] }> {
  const { data } = await apiClient.get('/maintenance-plans/tasks', {
    params: status && status !== 'all' ? { status } : {},
  });
  return data;
}
