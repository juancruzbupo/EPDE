import { useMutation } from '@tanstack/react-query';
import { uploadFile } from '@/lib/api/upload';

export function useUploadFile() {
  return useMutation({
    mutationFn: ({ uri, folder }: { uri: string; folder: string }) => uploadFile(uri, folder),
  });
}
