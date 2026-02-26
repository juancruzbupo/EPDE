import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenService } from './token-service';

const API_BASE_URL = __DEV__ ? 'http://localhost:3001/api/v1' : 'https://api.epde.com.ar/api/v1';

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

      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);
