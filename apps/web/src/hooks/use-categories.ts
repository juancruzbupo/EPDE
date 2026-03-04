import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@epde/shared';
import { getErrorMessage } from '@/lib/errors';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/api/categories';

export function useCategories() {
  return useQuery({
    queryKey: [QUERY_KEYS.categories],
    queryFn: ({ signal }) => getCategories(signal).then((r) => r.data),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      toast.success('Categoría creada');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.categories] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al crear categoría'));
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...dto
    }: {
      id: string;
      name?: string;
      description?: string;
      icon?: string;
      order?: number;
    }) => updateCategory(id, dto),
    onSuccess: () => {
      toast.success('Categoría actualizada');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.categories] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al actualizar categoría'));
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      toast.success('Categoría eliminada');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.categories] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al eliminar categoría'));
    },
  });
}
