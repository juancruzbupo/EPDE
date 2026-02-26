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
    async getPlan(id: string): Promise<ApiResponse<PlanPublic>> {
      const { data } = await apiClient.get(`/maintenance-plans/${id}`);
      return data;
    },

    async getTaskDetail(planId: string, taskId: string): Promise<ApiResponse<TaskDetailPublic>> {
      const { data } = await apiClient.get(`/maintenance-plans/${planId}/tasks/${taskId}`);
      return data;
    },

    async getTaskLogs(planId: string, taskId: string): Promise<ApiResponse<TaskLogPublic[]>> {
      const { data } = await apiClient.get(`/maintenance-plans/${planId}/tasks/${taskId}/logs`);
      return data;
    },

    async getTaskNotes(planId: string, taskId: string): Promise<ApiResponse<TaskNotePublic[]>> {
      const { data } = await apiClient.get(`/maintenance-plans/${planId}/tasks/${taskId}/notes`);
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
