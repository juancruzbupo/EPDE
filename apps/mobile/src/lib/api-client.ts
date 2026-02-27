import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { tokenService } from './token-service';

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

const API_BASE_URL = __DEV__ ? getDevApiUrl() : 'https://api.epde.com.ar/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Type': 'mobile',
  },
  timeout: 15000,
});

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenService.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Singleton refresh to avoid concurrent refresh calls
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  try {
    const refreshToken = await tokenService.getRefreshToken();
    if (!refreshToken) return false;

    const { data } = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Type': 'mobile',
        },
      },
    );

    await tokenService.setTokens(data.data.accessToken, data.data.refreshToken);
    return true;
  } catch {
    await tokenService.clearTokens();
    return false;
  }
}

// Response interceptor: handle 401 with auto-refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = doRefresh().finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      }

      const success = await refreshPromise;
      if (success) {
        const newToken = await tokenService.getAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }

      // Refresh failed — signal logout to UI via dynamic import to avoid circular deps
      const { useAuthStore } = await import('../stores/auth-store');
      await useAuthStore.getState().logout();

      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);
