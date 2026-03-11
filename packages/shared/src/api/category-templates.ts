import type { AxiosInstance } from 'axios';

import type {
  CreateCategoryTemplateInput,
  UpdateCategoryTemplateInput,
} from '../schemas/task-template';
import type { CreateTaskTemplateInput, UpdateTaskTemplateInput } from '../schemas/task-template';
import type { ApiResponse, CategoryTemplate, PaginatedResponse } from '../types';

/**
 * Creates query and mutation functions for category and task templates.
 * @param apiClient Axios instance (web uses proxy `/api/v1`, mobile uses direct URL)
 */
export function createCategoryTemplateQueries(apiClient: AxiosInstance) {
  return {
    // --- Queries ---

    async getCategoryTemplates(signal?: AbortSignal): Promise<PaginatedResponse<CategoryTemplate>> {
      const { data } = await apiClient.get('/category-templates', { signal });
      return data;
    },

    async getCategoryTemplate(
      id: string,
      signal?: AbortSignal,
    ): Promise<ApiResponse<CategoryTemplate>> {
      const { data } = await apiClient.get(`/category-templates/${id}`, { signal });
      return data;
    },

    // --- Mutations ---

    async createCategoryTemplate(
      dto: CreateCategoryTemplateInput,
    ): Promise<ApiResponse<CategoryTemplate>> {
      const { data } = await apiClient.post('/category-templates', dto);
      return data;
    },

    async updateCategoryTemplate(
      id: string,
      dto: UpdateCategoryTemplateInput,
    ): Promise<ApiResponse<CategoryTemplate>> {
      const { data } = await apiClient.patch(`/category-templates/${id}`, dto);
      return data;
    },

    async deleteCategoryTemplate(id: string): Promise<ApiResponse<CategoryTemplate>> {
      const { data } = await apiClient.delete(`/category-templates/${id}`);
      return data;
    },

    // Task templates (nested under category)
    async createTaskTemplate(
      categoryId: string,
      dto: CreateTaskTemplateInput,
    ): Promise<ApiResponse<CategoryTemplate>> {
      const { data } = await apiClient.post(`/category-templates/${categoryId}/tasks`, dto);
      return data;
    },

    async updateTaskTemplate(
      id: string,
      dto: UpdateTaskTemplateInput,
    ): Promise<ApiResponse<CategoryTemplate>> {
      const { data } = await apiClient.patch(`/task-templates/${id}`, dto);
      return data;
    },

    async deleteTaskTemplate(id: string): Promise<ApiResponse<CategoryTemplate>> {
      const { data } = await apiClient.delete(`/task-templates/${id}`);
      return data;
    },
  };
}
