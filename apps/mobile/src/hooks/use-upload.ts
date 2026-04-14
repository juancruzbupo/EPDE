// Web equivalent: apps/web/src/hooks/use-upload.ts
import { getErrorMessage } from '@epde/shared';
import { useMutation } from '@tanstack/react-query';

import { uploadFile } from '@/lib/api/upload';
import { haptics } from '@/lib/haptics';
import { toast } from '@/lib/toast';

/**
 * Upload hook — validation lives in `uploadFile()` (API layer), not here.
 * On native platforms `File.size` is unavailable pre-upload, so size validation
 * is server-side. On web platform, `uploadFile()` validates MIME + size via
 * `validateUpload()`. See `apps/web/src/hooks/use-upload.ts` for the web pattern
 * where `File` is always available and validation happens inline in the hook.
 */
export function useUploadFile() {
  return useMutation({
    mutationFn: ({ uri, folder }: { uri: string; folder: string }) => uploadFile(uri, folder),
    onSuccess: () => {
      haptics.success();
      toast.success('Archivo subido');
    },
    onError: (err) => {
      haptics.error();
      toast.error(getErrorMessage(err, 'Error al subir archivo'));
    },
  });
}
