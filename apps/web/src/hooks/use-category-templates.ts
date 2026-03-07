import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import type {
  CreateCategoryTemplateInput,
  UpdateCategoryTemplateInput,
  CreateTaskTemplateInput,
  UpdateTaskTemplateInput,
} from '@epde/shared';
import {
  getCategoryTemplates,
  createCategoryTemplate,
  updateCategoryTemplate,
  deleteCategoryTemplate,
  createTaskTemplate,
  updateTaskTemplate,
  deleteTaskTemplate,
} from '@/lib/api/category-templates';

const QUERY_KEY = [QUERY_KEYS.categoryTemplates];

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
    onSuccess: () => {
      toast.success('Categoría template creada');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al crear categoría template')),
  });
}

export function useUpdateCategoryTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & UpdateCategoryTemplateInput) =>
      updateCategoryTemplate(id, dto),
    onSuccess: () => {
      toast.success('Categoría template actualizada');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al actualizar categoría template')),
  });
}

export function useDeleteCategoryTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategoryTemplate,
    onSuccess: () => {
      toast.success('Categoría template eliminada');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al eliminar categoría template')),
  });
}

export function useCreateTaskTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, ...dto }: { categoryId: string } & CreateTaskTemplateInput) =>
      createTaskTemplate(categoryId, dto),
    onSuccess: () => {
      toast.success('Tarea template creada');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al crear tarea template')),
  });
}

export function useUpdateTaskTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & UpdateTaskTemplateInput) =>
      updateTaskTemplate(id, dto),
    onSuccess: () => {
      toast.success('Tarea template actualizada');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al actualizar tarea template')),
  });
}

export function useDeleteTaskTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTaskTemplate,
    onSuccess: () => {
      toast.success('Tarea template eliminada');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Error al eliminar tarea template')),
  });
}
