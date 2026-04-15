import type { AxiosInstance } from 'axios';

import type { CompleteTaskInput } from '../schemas/task-log';
import type {
  ApiResponse,
  TaskDetailPublic,
  TaskListItem,
  TaskLogPublic,
  TaskNotePublic,
  TaskPublic,
} from '../types';
import type {
  ProfessionalRequirement,
  RecurrenceType,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '../types/enums';

export interface TaskListFilters {
  status?: TaskStatus;
  propertyId?: string;
}

export interface AddTaskRequest {
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
}

export interface UpdateTaskRequest {
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
}

/**
 * Creates query and mutation functions for the tasks domain.
 * Task-scoped endpoints live under `/maintenance-plans/:planId/tasks/...`
 * on the API; path shape is kept here intentionally (no rewrite) to avoid
 * coordinating a backend route change alongside this factory extraction.
 *
 * @param apiClient Axios instance (web uses proxy `/api/v1`, mobile uses direct URL)
 */
export function createTaskQueries(apiClient: AxiosInstance) {
  return {
    // --- Queries ---

    async getAllTasks(
      params?: TaskListFilters,
      signal?: AbortSignal,
    ): Promise<ApiResponse<TaskListItem[]>> {
      const { data } = await apiClient.get('/maintenance-plans/tasks', {
        params: params ?? {},
        signal,
      });
      return data;
    },

    async getTaskDetail(
      planId: string,
      taskId: string,
      signal?: AbortSignal,
    ): Promise<ApiResponse<TaskDetailPublic>> {
      const { data } = await apiClient.get(`/maintenance-plans/${planId}/tasks/${taskId}`, {
        signal,
      });
      return data;
    },

    async getTaskLogs(
      planId: string,
      taskId: string,
      signal?: AbortSignal,
    ): Promise<ApiResponse<TaskLogPublic[]>> {
      const { data } = await apiClient.get(`/maintenance-plans/${planId}/tasks/${taskId}/logs`, {
        signal,
      });
      return data;
    },

    async getTaskNotes(
      planId: string,
      taskId: string,
      signal?: AbortSignal,
    ): Promise<ApiResponse<TaskNotePublic[]>> {
      const { data } = await apiClient.get(`/maintenance-plans/${planId}/tasks/${taskId}/notes`, {
        signal,
      });
      return data;
    },

    // --- Client + admin mutations ---

    async completeTask(
      planId: string,
      taskId: string,
      dto: CompleteTaskInput,
    ): Promise<ApiResponse<{ task: TaskPublic; log: TaskLogPublic; problemDetected: boolean }>> {
      const { data } = await apiClient.post(
        `/maintenance-plans/${planId}/tasks/${taskId}/complete`,
        dto,
      );
      return data;
    },

    async addTaskNote(
      planId: string,
      taskId: string,
      dto: { content: string },
    ): Promise<ApiResponse<TaskNotePublic>> {
      const { data } = await apiClient.post(
        `/maintenance-plans/${planId}/tasks/${taskId}/notes`,
        dto,
      );
      return data;
    },

    // --- Admin-only mutations ---

    async addTask(planId: string, dto: AddTaskRequest): Promise<ApiResponse<TaskPublic>> {
      const { data } = await apiClient.post(`/maintenance-plans/${planId}/tasks`, dto);
      return data;
    },

    async updateTask(
      planId: string,
      taskId: string,
      dto: UpdateTaskRequest,
    ): Promise<ApiResponse<TaskPublic>> {
      const { data } = await apiClient.patch(`/maintenance-plans/${planId}/tasks/${taskId}`, dto);
      return data;
    },

    async bulkAddTasksFromTemplate(
      planId: string,
      categoryTemplateId: string,
    ): Promise<ApiResponse<{ created: number; skipped: number; skippedNames: string[] }>> {
      const { data } = await apiClient.post(`/maintenance-plans/${planId}/tasks/bulk`, {
        categoryTemplateId,
      });
      return data;
    },

    async removeTask(planId: string, taskId: string): Promise<ApiResponse<null>> {
      const { data } = await apiClient.delete(`/maintenance-plans/${planId}/tasks/${taskId}`);
      return data;
    },

    async reorderTasks(
      planId: string,
      tasks: { id: string; order: number }[],
    ): Promise<ApiResponse<null>> {
      const { data } = await apiClient.patch(`/maintenance-plans/${planId}/tasks/reorder`, {
        tasks,
      });
      return data;
    },
  };
}
