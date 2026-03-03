// Singleton refresh: only one refresh attempt per 401 cycle.
// If refresh fails, redirect to login — no retry loop, no backoff needed.
// CSRF protection: auth cookies use SameSite=strict (set by API),
// which prevents cross-site request forgery in modern browsers.
import axios from 'axios';
import { attachRefreshInterceptor } from '@epde/shared';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
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
