import type { AxiosInstance } from 'axios';
import type { ApiResponse, CategoryPublic } from '../types';

export function createCategoryQueries(apiClient: AxiosInstance) {
  return {
    async getCategories(signal?: AbortSignal): Promise<ApiResponse<CategoryPublic[]>> {
      const { data } = await apiClient.get('/categories', { signal });
      return data;
    },

    async createCategory(dto: {
      name: string;
      description?: string;
      icon?: string;
      order?: number;
    }): Promise<ApiResponse<CategoryPublic>> {
      const { data } = await apiClient.post('/categories', dto);
      return data;
    },

    async updateCategory(
      id: string,
      dto: { name?: string; description?: string; icon?: string; order?: number },
    ): Promise<ApiResponse<CategoryPublic>> {
      const { data } = await apiClient.patch(`/categories/${id}`, dto);
      return data;
    },

    async deleteCategory(id: string): Promise<ApiResponse<CategoryPublic>> {
      const { data } = await apiClient.delete(`/categories/${id}`);
      return data;
    },
  };
}
