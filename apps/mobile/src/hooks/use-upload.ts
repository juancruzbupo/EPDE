import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { uploadFile } from '@/lib/api/upload';
import { getErrorMessage } from '@epde/shared';

export function useUploadFile() {
  return useMutation({
    mutationFn: ({ uri, folder }: { uri: string; folder: string }) => uploadFile(uri, folder),
    onError: (err) => {
      Alert.alert('Error', getErrorMessage(err, 'Error al subir archivo'));
    },
  });
}
