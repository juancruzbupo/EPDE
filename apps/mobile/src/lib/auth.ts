import type {
  ChangePasswordInput,
  MobileAuthResponse,
  UpdateProfileInput,
  UserPublic,
} from '@epde/shared';

import { apiClient } from './api-client';
import { tokenService } from './token-service';

export async function login(email: string, password: string): Promise<UserPublic> {
  const { data } = await apiClient.post('/auth/login', { email, password });
  const result = data.data as MobileAuthResponse;

  await tokenService.setTokens(result.accessToken, result.refreshToken);
  return result.user;
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // Ignore errors on logout (token might be expired)
  }
  // Token clearing is handled by auth-store.logout()
}

export async function getMe(): Promise<UserPublic> {
  const { data } = await apiClient.get('/auth/me');
  return data.data as UserPublic;
}

export async function updateProfile(dto: UpdateProfileInput): Promise<UserPublic> {
  const { data } = await apiClient.patch('/auth/me', dto);
  return data.data as UserPublic;
}

export async function changePassword(dto: ChangePasswordInput): Promise<void> {
  await apiClient.patch('/auth/me/password', dto);
}

export async function setPassword(token: string, newPassword: string): Promise<void> {
  await apiClient.post('/auth/set-password', { token, newPassword });
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiClient.post('/auth/reset-password', { token, newPassword });
}
