import { apiClient } from './api-client';
import type { AuthResponse, UserPublic } from '@epde/shared/types';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data.data as AuthResponse;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function getMe(): Promise<UserPublic> {
  const { data } = await apiClient.get('/auth/me');
  return data.data as UserPublic;
}

export async function setPassword(token: string, newPassword: string): Promise<void> {
  await apiClient.post('/auth/set-password', { token, newPassword });
}
