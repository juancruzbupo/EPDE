// Singleton refresh: only one refresh attempt per 401 cycle.
// If refresh fails, redirect to login — no retry loop, no backoff needed.
// CSRF protection: auth cookies use SameSite=strict (same origin via proxy).
import { attachRefreshInterceptor, CLIENT_TYPE_HEADER, CLIENT_TYPES } from '@epde/shared';
import axios from 'axios';

// Browser requests go through Next.js proxy (same origin → cookies work)
// In development, proxy rewrites to localhost:3001
// In production, proxy rewrites to API_PROXY_TARGET (Render)
const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    [CLIENT_TYPE_HEADER]: CLIENT_TYPES.WEB,
  },
});

attachRefreshInterceptor({
  client: apiClient,
  doRefresh: async () => {
    try {
      await apiClient.post('/auth/refresh');
      return true;
    } catch {
      return false;
    }
  },
  onRefreshFail: () => {
    if (
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/login') &&
      !window.location.pathname.startsWith('/set-password') &&
      window.location.pathname !== '/'
    ) {
      window.location.href = '/login';
    }
  },
});

export { apiClient };
