import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/errors';

export function useUploadFile() {
  return useMutation({
    mutationFn: async ({ file, folder }: { file: File; folder: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      const { data } = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data.url as string;
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al subir archivo'));
    },
  });
}
