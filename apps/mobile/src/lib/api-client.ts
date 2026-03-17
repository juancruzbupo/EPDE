import { attachRefreshInterceptor, CLIENT_TYPE_HEADER, CLIENT_TYPES } from '@epde/shared';
import type { InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { tokenService } from './token-service';

function getDevApiUrl(): string {
  // On web, localhost works fine
  if (Platform.OS === 'web') return 'http://localhost:3001/api/v1';

  // On native device, extract the dev server host IP from Expo
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];

  if (!host) {
    console.warn(
      '[API] Expo hostUri unavailable — falling back to localhost. Physical device will fail.',
    );
  }

  return `http://${host || 'localhost'}:3001/api/v1`;
}

const API_BASE_URL = __DEV__
  ? getDevApiUrl()
  : (process.env.EXPO_PUBLIC_API_URL ?? 'https://api.epde.com.ar/api/v1');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    [CLIENT_TYPE_HEADER]: CLIENT_TYPES.MOBILE,
  },
  timeout: 15_000,
});

/**
 * TODO (PRE-PRODUCTION): Implement certificate pinning.
 *
 * Without pinning, the app is vulnerable to MITM attacks on public WiFi.
 * Steps:
 * 1. Install `react-native-ssl-pinning` or use TrustKit
 * 2. Extract SHA-256 pin from production API certificate
 * 3. Configure pinned domains: ['api.epde.com.ar']
 * 4. Add backup pin (next certificate rotation)
 * 5. Test with Charles Proxy (should fail with pinning enabled)
 *
 * See: SIEMPRE #28 in ai-development-guide.md
 */

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenService.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

attachRefreshInterceptor({
  client: apiClient,
  doRefresh: async () => {
    try {
      const refreshToken = await tokenService.getRefreshToken();
      if (!refreshToken) return false;

      const { data } = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
            [CLIENT_TYPE_HEADER]: CLIENT_TYPES.MOBILE,
          },
        },
      );

      if (!data?.data?.accessToken || !data?.data?.refreshToken) {
        await tokenService.clearTokens();
        return false;
      }

      await tokenService.setTokens(data.data.accessToken, data.data.refreshToken);
      return true;
    } catch {
      await tokenService.clearTokens();
      return false;
    }
  },
  onRefreshFail: async () => {
    // Signal logout to UI via dynamic import to avoid circular deps
    const { useAuthStore } = await import('../stores/auth-store');
    await useAuthStore.getState().logout();
  },
  onRetry: async (config) => {
    const newToken = await tokenService.getAccessToken();
    config.headers.Authorization = `Bearer ${newToken}`;
  },
});
