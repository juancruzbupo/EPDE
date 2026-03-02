import { createMaintenancePlanQueries } from '@epde/shared/api';
import { apiClient } from '../api-client';

const queries = createMaintenancePlanQueries(apiClient);
export const { getPlan, getTaskDetail, getTaskLogs, getTaskNotes, completeTask, addTaskNote } =
  queries;

export interface PlanListItem {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  property: { id: string; address: string; city: string; userId: string };
  _count: { tasks: number };
}

export interface TaskListItem {
  id: string;
  name: string;
  status: string;
  priority: string;
  nextDueDate: string | null;
  recurrenceType: string;
  category: { id: string; name: string; icon: string | null };
  maintenancePlan: {
    id: string;
    name: string;
    property: { id: string; address: string; city: string };
  };
}

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
