import type { AxiosInstance } from 'axios';
import type { ApiResponse, CategoryTemplate } from '../types';
import type {
  CreateCategoryTemplateInput,
  UpdateCategoryTemplateInput,
} from '../schemas/task-template';
import type { CreateTaskTemplateInput, UpdateTaskTemplateInput } from '../schemas/task-template';

export function createCategoryTemplateQueries(apiClient: AxiosInstance) {
  return {
    async getCategoryTemplates(
      signal?: AbortSignal,
    ): Promise<{ data: CategoryTemplate[]; cursor: string | null }> {
      const { data } = await apiClient.get('/category-templates', { signal });
      return data;
    },

    async getCategoryTemplate(
      id: string,
      signal?: AbortSignal,
    ): Promise<{ data: CategoryTemplate }> {
      const { data } = await apiClient.get(`/category-templates/${id}`, { signal });
      return data;
    },

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
