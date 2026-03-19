import type {
  ApiResponse,
  PlanPublic,
  PlanStatus,
  ProfessionalRequirement,
  RecurrenceType,
  TaskPriority,
  TaskPublic,
  TaskStatus,
  TaskType,
} from '@epde/shared';
import { createMaintenancePlanQueries } from '@epde/shared';

import { apiClient } from '../api-client';

export type {
  PlanListItem,
  PlanPublic,
  TaskDetailPublic,
  TaskListItem,
  TaskLogPublic,
  TaskNotePublic,
  TaskPublic,
} from '@epde/shared';

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

/**
 * Admin-only mutations. Wire-format DTOs (string dates) — validation SSoT
 * lives in `@epde/shared/schemas/task.ts` (createTaskSchema, updateTaskSchema).
 */
export async function updatePlan(
  id: string,
  dto: { name?: string; status?: PlanStatus },
): Promise<ApiResponse<PlanPublic>> {
  const { data } = await apiClient.patch(`/maintenance-plans/${id}`, dto);
  return data;
}

export async function addTask(
  planId: string,
  dto: {
    categoryId: string;
    name: string;
    description?: string;
    priority?: TaskPriority;
    recurrenceType?: RecurrenceType;
    recurrenceMonths?: number;
    nextDueDate?: string;
    taskType?: TaskType;
    professionalRequirement?: ProfessionalRequirement;
    technicalDescription?: string;
    estimatedDurationMinutes?: number;
  },
): Promise<ApiResponse<TaskPublic>> {
  const { data } = await apiClient.post(`/maintenance-plans/${planId}/tasks`, dto);
  return data;
}

export async function updateTask(
  planId: string,
  taskId: string,
  dto: {
    categoryId?: string;
    name?: string;
    description?: string;
    priority?: TaskPriority;
    recurrenceType?: RecurrenceType;
    recurrenceMonths?: number;
    nextDueDate?: string;
    status?: TaskStatus;
    taskType?: TaskType;
    professionalRequirement?: ProfessionalRequirement;
    technicalDescription?: string | null;
    estimatedDurationMinutes?: number | null;
  },
): Promise<ApiResponse<TaskPublic>> {
  const { data } = await apiClient.patch(`/maintenance-plans/${planId}/tasks/${taskId}`, dto);
  return data;
}

export async function bulkAddTasksFromTemplate(
  planId: string,
  categoryTemplateId: string,
): Promise<ApiResponse<{ count: number }>> {
  const { data } = await apiClient.post(`/maintenance-plans/${planId}/tasks/bulk`, {
    categoryTemplateId,
  });
  return data;
}

export async function removeTask(planId: string, taskId: string): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete(`/maintenance-plans/${planId}/tasks/${taskId}`);
  return data;
}

export async function reorderTasks(
  planId: string,
  tasks: { id: string; order: number }[],
): Promise<ApiResponse<null>> {
  const { data } = await apiClient.patch(`/maintenance-plans/${planId}/tasks/reorder`, { tasks });
  return data;
}
