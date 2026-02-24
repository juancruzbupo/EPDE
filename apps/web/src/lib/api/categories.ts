import { apiClient } from '../api-client';
import type { ApiResponse } from '@epde/shared';

export interface CategoryPublic {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  order: number;
}

export async function getCategories(): Promise<ApiResponse<CategoryPublic[]>> {
  const { data } = await apiClient.get('/categories');
  return data;
}

export async function createCategory(dto: {
  name: string;
  description?: string;
  icon?: string;
  order?: number;
}) {
  const { data } = await apiClient.post('/categories', dto);
  return data;
}

export async function updateCategory(
  id: string,
  dto: { name?: string; description?: string; icon?: string; order?: number },
) {
  const { data } = await apiClient.patch(`/categories/${id}`, dto);
  return data;
}

export async function deleteCategory(id: string) {
  const { data } = await apiClient.delete(`/categories/${id}`);
  return data;
}
