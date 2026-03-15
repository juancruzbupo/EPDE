import { getErrorMessage, validateUpload } from '@epde/shared';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api-client';

/**
 * Web upload hook — accepts a `File` object and validates MIME + size client-side
 * via `validateUpload()` before uploading. Server also validates magic bytes.
 *
 * Platform note: the mobile counterpart (`apps/mobile/src/hooks/use-upload.ts`)
 * accepts `{ uri: string, folder }` instead of `{ file: File, folder }` because
 * React Native doesn't expose the Web File API.
 */
export function useUploadFile() {
  return useMutation({
    mutationFn: async ({ file, folder }: { file: File; folder: string }) => {
      const error = validateUpload(file.type, file.size);
      if (error) throw new Error(error.message);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      const { data } = await apiClient.post<{ data: { url: string } }>('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data.url;
    },
    onSuccess: () => toast.success('Archivo subido'),
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al subir archivo'));
    },
  });
}
