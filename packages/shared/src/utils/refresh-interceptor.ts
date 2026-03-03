import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export interface RefreshInterceptorOptions {
  /** The axios instance to attach the interceptor to */
  client: AxiosInstance;
  /** Perform the token refresh. Return true if refresh succeeded. */
  doRefresh: () => Promise<boolean>;
  /** Called when refresh fails (e.g., redirect to login or trigger logout) */
  onRefreshFail: () => void | Promise<void>;
  /** Called before retrying the original request (e.g., to update Authorization header) */
  onRetry?: (config: InternalAxiosRequestConfig) => void | Promise<void>;
  /** URL substrings to skip (default: ['/auth/login', '/auth/refresh']) */
  skipUrls?: string[];
}

const DEFAULT_SKIP_URLS = ['/auth/login', '/auth/refresh'];

/**
 * Attach a singleton token-refresh interceptor to an axios instance.
 *
 * On 401, coalesces concurrent refreshes into a single attempt.
 * If refresh succeeds, retries the original request.
 * If refresh fails, calls `onRefreshFail`.
 */
export function attachRefreshInterceptor(options: RefreshInterceptorOptions): void {
  const { client, doRefresh, onRefreshFail, onRetry, skipUrls = DEFAULT_SKIP_URLS } = options;

  let isRefreshing = false;
  let refreshPromise: Promise<boolean> | null = null;

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryableConfig | undefined;

      if (
        !originalRequest ||
        error.response?.status !== 401 ||
        originalRequest._retry ||
        skipUrls.some((url) => originalRequest.url?.includes(url))
      ) {
        return Promise.reject(error);
      }

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
        if (onRetry) {
          await onRetry(originalRequest);
        }
        return client(originalRequest);
      }

      await onRefreshFail();
      return Promise.reject(error);
    },
  );
}
