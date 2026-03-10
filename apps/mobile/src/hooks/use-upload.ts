import { getErrorMessage } from '@epde/shared';
import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';

import { uploadFile } from '@/lib/api/upload';

export function useUploadFile() {
  return useMutation({
    mutationFn: ({ uri, folder }: { uri: string; folder: string }) => uploadFile(uri, folder),
    onSuccess: () => Alert.alert('Éxito', 'Archivo subido'),
    onError: (err) => {
      Alert.alert('Error', getErrorMessage(err, 'Error al subir archivo'));
    },
  });
}
