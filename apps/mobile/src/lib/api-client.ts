import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { tokenService } from './token-service';
import { CLIENT_TYPE_HEADER, CLIENT_TYPES, attachRefreshInterceptor } from '@epde/shared';

function getDevApiUrl(): string {
  // On web, localhost works fine
  if (Platform.OS === 'web') return 'http://localhost:3001/api/v1';

  // On native device, extract the dev server host IP from Expo
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  if (host) return `http://${host}:3001/api/v1`;

  // Fallback
  return 'http://localhost:3001/api/v1';
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
  timeout: 15000,
});

// TODO [PRE-RELEASE]: Certificate pinning
// Package: react-native-ssl-pinning (npm i react-native-ssl-pinning)
// Replace axios instance with SSLPinning.fetch() for protected requests.
// Get server cert SHA-256 fingerprint:
//   openssl s_client -connect <api-host>:443 < /dev/null | openssl x509 -fingerprint -sha256 -noout
// Store fingerprint in .env as API_SSL_FINGERPRINT and read via expo-constants at build time.
// See: https://github.com/MaxToyberman/react-native-ssl-pinning

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
