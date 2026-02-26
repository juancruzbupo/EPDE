import type { AxiosInstance } from 'axios';
import type {
  ApiResponse,
  PlanPublic,
  TaskDetailPublic,
  TaskLogPublic,
  TaskNotePublic,
} from '../types';

export function createMaintenancePlanQueries(apiClient: AxiosInstance) {
  return {
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

    async completeTask(planId: string, taskId: string, dto: { notes?: string; photoUrl?: string }) {
      const { data } = await apiClient.post(
        `/maintenance-plans/${planId}/tasks/${taskId}/complete`,
        dto,
      );
      return data;
    },

    async addTaskNote(planId: string, taskId: string, dto: { content: string }) {
      const { data } = await apiClient.post(
        `/maintenance-plans/${planId}/tasks/${taskId}/notes`,
        dto,
      );
      return data;
    },
  };
}
