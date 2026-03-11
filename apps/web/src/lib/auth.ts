import type { AuthResponse, UserPublic } from '@epde/shared';

import { apiClient } from './api-client';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<{ data: AuthResponse }>('/auth/login', {
    email,
    password,
  });
  if (!data?.data?.user) {
    throw new Error('Respuesta de login inválida');
  }
  return data.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function getMe(): Promise<UserPublic> {
  const { data } = await apiClient.get<{ data: UserPublic }>('/auth/me');
  if (!data?.data?.id) {
    throw new Error('Respuesta de usuario inválida');
  }
  return data.data;
}

export async function setPassword(token: string, newPassword: string): Promise<void> {
  await apiClient.post('/auth/set-password', { token, newPassword });
}
