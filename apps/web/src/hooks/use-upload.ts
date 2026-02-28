import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/errors';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function useUploadFile() {
  return useMutation({
    mutationFn: async ({ file, folder }: { file: File; folder: string }) => {
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        throw new Error(`Tipo de archivo no permitido: ${file.type}`);
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('El archivo excede el tamaño máximo de 10 MB');
      }
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
