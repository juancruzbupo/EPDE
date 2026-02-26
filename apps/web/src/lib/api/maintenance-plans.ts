import { createMaintenancePlanQueries } from '@epde/shared/api';
import { apiClient } from '../api-client';

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
    nextDueDate: string;
  },
) {
  const { data } = await apiClient.post(`/maintenance-plans/${planId}/tasks`, dto);
  return data;
}

export async function updateTask(planId: string, taskId: string, dto: Record<string, unknown>) {
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
