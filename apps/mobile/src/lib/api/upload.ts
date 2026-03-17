import { validateUpload } from '@epde/shared';
import { Platform } from 'react-native';

import { apiClient } from '../api-client';

export async function uploadFile(uri: string, folder: string): Promise<string> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    const error = validateUpload(blob.type, blob.size);
    if (error) throw new Error(error.message);
    formData.append('file', blob, 'photo.jpg');
  } else {
    const filename = uri.split('/').pop() ?? 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const ext = match?.[1]?.toLowerCase() ?? 'jpeg';
    // .jpg → image/jpeg (not image/jpg which is non-standard and rejected by backend)
    const type = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    // Native: file size unknown before upload — API validates server-side
    formData.append('file', { uri, name: filename, type } as unknown as Blob);
  }

  formData.append('folder', folder);

  const { data } = await apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data.url as string;
}
