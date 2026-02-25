import { apiClient } from '../api-client';
import type {
  ApiResponse,
  TaskPublic,
  TaskDetailPublic,
  TaskLogPublic,
  TaskNotePublic,
  PlanPublic,
} from '@epde/shared';

export type { TaskPublic, TaskDetailPublic, TaskLogPublic, TaskNotePublic, PlanPublic };

export async function getPlan(id: string): Promise<ApiResponse<PlanPublic>> {
  const { data } = await apiClient.get(`/maintenance-plans/${id}`);
  return data;
}

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

export async function getTaskDetail(
  planId: string,
  taskId: string,
): Promise<ApiResponse<TaskDetailPublic>> {
  const { data } = await apiClient.get(`/maintenance-plans/${planId}/tasks/${taskId}`);
  return data;
}

export async function completeTask(
  planId: string,
  taskId: string,
  dto: { notes?: string; photoUrl?: string },
) {
  const { data } = await apiClient.post(
    `/maintenance-plans/${planId}/tasks/${taskId}/complete`,
    dto,
  );
  return data;
}

export async function getTaskLogs(
  planId: string,
  taskId: string,
): Promise<ApiResponse<TaskLogPublic[]>> {
  const { data } = await apiClient.get(`/maintenance-plans/${planId}/tasks/${taskId}/logs`);
  return data;
}

export async function getTaskNotes(
  planId: string,
  taskId: string,
): Promise<ApiResponse<TaskNotePublic[]>> {
  const { data } = await apiClient.get(`/maintenance-plans/${planId}/tasks/${taskId}/notes`);
  return data;
}

export async function addTaskNote(planId: string, taskId: string, dto: { content: string }) {
  const { data } = await apiClient.post(`/maintenance-plans/${planId}/tasks/${taskId}/notes`, dto);
  return data;
}
