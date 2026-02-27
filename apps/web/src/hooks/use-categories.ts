import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const data = (error as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  return fallback;
}
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/api/categories';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then((r) => r.data),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al actualizar categoría'));
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al eliminar categoría'));
    },
  });
}
