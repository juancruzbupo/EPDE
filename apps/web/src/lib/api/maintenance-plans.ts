import { apiClient } from '../api-client';
import type { ApiResponse } from '@epde/shared';

export interface TaskPublic {
  id: string;
  name: string;
  description: string | null;
  priority: string;
  recurrenceType: string;
  recurrenceMonths: number | null;
  nextDueDate: string;
  order: number;
  status: string;
  category: { id: string; name: string; icon: string | null };
}

export interface PlanPublic {
  id: string;
  propertyId: string;
  name: string;
  status: string;
  tasks: TaskPublic[];
  property?: {
    id: string;
    address: string;
    city: string;
    user?: { id: string; name: string; email: string };
  };
}

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
