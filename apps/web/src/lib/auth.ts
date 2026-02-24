import { apiClient } from './api-client';
import type { AuthResponse, UserPublic } from '@epde/shared/types';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post('/auth/login', { email, password });
  const result = data.data as AuthResponse;
  localStorage.setItem('access_token', result.accessToken);
  return result;
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    localStorage.removeItem('access_token');
  }
}

export async function getMe(): Promise<UserPublic> {
  const { data } = await apiClient.get('/auth/me');
  return data.data as UserPublic;
}

export async function setPassword(token: string, newPassword: string): Promise<void> {
  await apiClient.post('/auth/set-password', { token, newPassword });
}
