import { createMaintenancePlanQueries } from '@epde/shared/api';
import { apiClient } from '../api-client';

export interface UpdateTaskDto {
  categoryId?: string;
  name?: string;
  description?: string;
  priority?: string;
  recurrenceType?: string;
  recurrenceMonths?: number;
  nextDueDate?: string | Date;
  status?: string;
}

export type {
  TaskPublic,
  TaskDetailPublic,
  TaskLogPublic,
  TaskNotePublic,
  PlanPublic,
} from '@epde/shared';

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

// Admin-only
export async function updatePlan(id: string, dto: { name?: string; status?: string }) {
  const { data } = await apiClient.patch(`/maintenance-plans/${id}`, dto);
  return data;
}

export async function addTask(
  planId: string,
  dto: {
    categoryId: string;
    name: string;
    description?: string;
    priority?: string;
    recurrenceType?: string;
    recurrenceMonths?: number;
    nextDueDate?: string;
  },
) {
  const { data } = await apiClient.post(`/maintenance-plans/${planId}/tasks`, dto);
  return data;
}

export async function updateTask(planId: string, taskId: string, dto: UpdateTaskDto) {
  const { data } = await apiClient.patch(`/maintenance-plans/${planId}/tasks/${taskId}`, dto);
  return data;
}

export async function removeTask(planId: string, taskId: string) {
  const { data } = await apiClient.delete(`/maintenance-plans/${planId}/tasks/${taskId}`);
  return data;
}

export async function reorderTasks(planId: string, tasks: { id: string; order: number }[]) {
  const { data } = await apiClient.put(`/maintenance-plans/${planId}/tasks/reorder`, { tasks });
  return data;
}
