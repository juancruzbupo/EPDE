import { apiClient } from '../api-client';
import type {
  ApiResponse,
  PlanPublic,
  TaskDetailPublic,
  TaskLogPublic,
  TaskNotePublic,
} from '@epde/shared/types';

export async function getPlan(id: string): Promise<ApiResponse<PlanPublic>> {
  const { data } = await apiClient.get(`/maintenance-plans/${id}`);
  return data;
}

export async function getTaskDetail(
  planId: string,
  taskId: string,
): Promise<ApiResponse<TaskDetailPublic>> {
  const { data } = await apiClient.get(`/maintenance-plans/${planId}/tasks/${taskId}`);
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

export async function addTaskNote(planId: string, taskId: string, dto: { content: string }) {
  const { data } = await apiClient.post(`/maintenance-plans/${planId}/tasks/${taskId}/notes`, dto);
  return data;
}
