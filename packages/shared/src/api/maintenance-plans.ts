import type { AxiosInstance } from 'axios';

import type { CompleteTaskInput } from '../schemas/task-log';
import type {
  ApiResponse,
  PlanListItem,
  PlanPublic,
  TaskDetailPublic,
  TaskListItem,
  TaskLogPublic,
  TaskNotePublic,
  TaskPublic,
} from '../types';
import type { TaskStatus } from '../types/enums';

// Note: getPlans/getAllTasks return ApiResponse<T[]> (array wrapped in { data }),
// not PaginatedResponse, because these endpoints return full lists without cursor pagination.

/**
 * Creates query and mutation functions for the maintenance plans domain.
 * @param apiClient Axios instance (web uses proxy `/api/v1`, mobile uses direct URL)
 */
export function createMaintenancePlanQueries(apiClient: AxiosInstance) {
  return {
    // --- Queries ---

    async getPlans(signal?: AbortSignal): Promise<ApiResponse<PlanListItem[]>> {
      const { data } = await apiClient.get('/maintenance-plans', { signal });
      return data;
    },

    async getAllTasks(
      params?: { status?: TaskStatus; propertyId?: string },
      signal?: AbortSignal,
    ): Promise<ApiResponse<TaskListItem[]>> {
      const { data } = await apiClient.get('/maintenance-plans/tasks', {
        params: params ?? {},
        signal,
      });
      return data;
    },

    async getPlan(id: string, signal?: AbortSignal): Promise<ApiResponse<PlanPublic>> {
      const { data } = await apiClient.get(`/maintenance-plans/${id}`, { signal });
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

    // --- Mutations ---

    async completeTask(
      planId: string,
      taskId: string,
      dto: CompleteTaskInput,
    ): Promise<ApiResponse<{ task: TaskPublic; log: TaskLogPublic }>> {
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
  };
}
