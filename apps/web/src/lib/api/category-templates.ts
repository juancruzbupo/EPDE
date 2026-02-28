import { apiClient } from '../api-client';
import type {
  CreateCategoryTemplateInput,
  UpdateCategoryTemplateInput,
  CategoryTemplate,
} from '@epde/shared';

export type { CategoryTemplate };

export async function getCategoryTemplates(signal?: AbortSignal) {
  const { data } = await apiClient.get('/category-templates', { signal });
  return data as { data: CategoryTemplate[]; cursor: string | null };
}

export async function getCategoryTemplate(id: string) {
  const { data } = await apiClient.get(`/category-templates/${id}`);
  return data as { data: CategoryTemplate };
}

export async function createCategoryTemplate(dto: CreateCategoryTemplateInput) {
  const { data } = await apiClient.post('/category-templates', dto);
  return data;
}

export async function updateCategoryTemplate(id: string, dto: UpdateCategoryTemplateInput) {
  const { data } = await apiClient.patch(`/category-templates/${id}`, dto);
  return data;
}

export async function deleteCategoryTemplate(id: string) {
  const { data } = await apiClient.delete(`/category-templates/${id}`);
  return data;
}

// Task templates (nested under category)
import type { CreateTaskTemplateInput, UpdateTaskTemplateInput } from '@epde/shared';

export async function createTaskTemplate(categoryId: string, dto: CreateTaskTemplateInput) {
  const { data } = await apiClient.post(`/category-templates/${categoryId}/tasks`, dto);
  return data;
}

export async function updateTaskTemplate(id: string, dto: UpdateTaskTemplateInput) {
  const { data } = await apiClient.patch(`/task-templates/${id}`, dto);
  return data;
}

export async function deleteTaskTemplate(id: string) {
  const { data } = await apiClient.delete(`/task-templates/${id}`);
  return data;
}
