import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import {
  getCategoryTemplates,
  createCategoryTemplate,
  updateCategoryTemplate,
  deleteCategoryTemplate,
  createTaskTemplate,
  updateTaskTemplate,
  deleteTaskTemplate,
} from '@/lib/api/category-templates';
import type {
  CreateCategoryTemplateInput,
  UpdateCategoryTemplateInput,
  CreateTaskTemplateInput,
  UpdateTaskTemplateInput,
} from '@epde/shared';

const QUERY_KEY = ['category-templates'];

export function useCategoryTemplates() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: ({ signal }) => getCategoryTemplates(signal).then((r) => r.data),
  });
}

export function useCreateCategoryTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCategoryTemplateInput) => createCategoryTemplate(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    onError: (err) => toast.error(getErrorMessage(err, 'Error al crear categoría template')),
  });
}

export function useUpdateCategoryTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & UpdateCategoryTemplateInput) =>
      updateCategoryTemplate(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    onError: (err) => toast.error(getErrorMessage(err, 'Error al actualizar categoría template')),
  });
}

export function useDeleteCategoryTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategoryTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    onError: (err) => toast.error(getErrorMessage(err, 'Error al eliminar categoría template')),
  });
}

export function useCreateTaskTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, ...dto }: { categoryId: string } & CreateTaskTemplateInput) =>
      createTaskTemplate(categoryId, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    onError: (err) => toast.error(getErrorMessage(err, 'Error al crear tarea template')),
  });
}

export function useUpdateTaskTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & UpdateTaskTemplateInput) =>
      updateTaskTemplate(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    onError: (err) => toast.error(getErrorMessage(err, 'Error al actualizar tarea template')),
  });
}

export function useDeleteTaskTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTaskTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    onError: (err) => toast.error(getErrorMessage(err, 'Error al eliminar tarea template')),
  });
}
