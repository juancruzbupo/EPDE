import { Platform } from 'react-native';
import { apiClient } from '../api-client';

export async function uploadFile(uri: string, folder: string): Promise<string> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    formData.append('file', blob, 'photo.jpg');
  } else {
    const filename = uri.split('/').pop() ?? 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    formData.append('file', { uri, name: filename, type } as unknown as Blob);
  }

  formData.append('folder', folder);

  const { data } = await apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data.url as string;
}
