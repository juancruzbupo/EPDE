import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { attachRefreshInterceptor } from '../utils/refresh-interceptor';

function createMockClient() {
  const client = axios.create();
  // Capture the error handler registered by attachRefreshInterceptor
  let errorHandler: (error: AxiosError) => Promise<unknown>;

  const originalUse = client.interceptors.response.use.bind(client.interceptors.response);
  vi.spyOn(client.interceptors.response, 'use').mockImplementation(
    (_onFulfilled: unknown, onRejected: unknown) => {
      errorHandler = onRejected as typeof errorHandler;
      return originalUse(
        () => {},
        () => {},
      );
    },
  );

  // Mock the client callable (for retrying requests)
  const clientCallable = vi.fn().mockResolvedValue({ data: 'retried' });
  return {
    client,
    getErrorHandler: () => errorHandler!,
    clientCallable,
    createError: (
      status: number,
      url = '/api/resource',
      config?: Partial<InternalAxiosRequestConfig> & { _retry?: boolean },
    ): AxiosError => ({
      config: { url, ...config } as InternalAxiosRequestConfig,
      response: { status } as AxiosResponse,
      isAxiosError: true,
      name: 'AxiosError',
      message: `Request failed with status ${status}`,
      toJSON: () => ({}),
    }),
  };
}

describe('attachRefreshInterceptor', () => {
  let mockClient: ReturnType<typeof createMockClient>;
  let doRefresh: ReturnType<typeof vi.fn>;
  let onRefreshFail: ReturnType<typeof vi.fn>;
  let onRetry: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockClient = createMockClient();
    doRefresh = vi.fn();
    onRefreshFail = vi.fn();
    onRetry = vi.fn();
  });

  function setup(skipUrls?: string[]) {
    // Override client as callable for retry
    const clientFn = vi.fn().mockResolvedValue({ data: 'retried' });
    Object.assign(clientFn, mockClient.client);
    // Re-attach interceptor use spy
    (clientFn as unknown as { interceptors: typeof mockClient.client.interceptors }).interceptors =
      mockClient.client.interceptors;

    attachRefreshInterceptor({
      client: clientFn as unknown as ReturnType<typeof axios.create>,
      doRefresh,
      onRefreshFail,
      onRetry,
      ...(skipUrls && { skipUrls }),
    });

    return { clientFn };
  }

  it('ignores non-401/non-403 errors (400, 500)', async () => {
    setup();
    const handler = mockClient.getErrorHandler();

    for (const status of [400, 500]) {
      const error = mockClient.createError(status);
      await expect(handler(error)).rejects.toBe(error);
    }

    expect(doRefresh).not.toHaveBeenCalled();
    expect(onRefreshFail).not.toHaveBeenCalled();
  });

  it('calls onRefreshFail on 403 without attempting refresh (role revoked)', async () => {
    setup();
    const handler = mockClient.getErrorHandler();
    const error = mockClient.createError(403, '/api/resource');

    await expect(handler(error)).rejects.toBe(error);
    expect(onRefreshFail).toHaveBeenCalledOnce();
    expect(doRefresh).not.toHaveBeenCalled();
  });

  it('skips 403 handling for skipUrls', async () => {
    setup();
    const handler = mockClient.getErrorHandler();
    const error = mockClient.createError(403, '/auth/login');

    await expect(handler(error)).rejects.toBe(error);
    expect(onRefreshFail).not.toHaveBeenCalled();
  });

  it('ignores 401 on /auth/login (default skipUrl)', async () => {
    setup();
    const handler = mockClient.getErrorHandler();
    const error = mockClient.createError(401, '/auth/login');

    await expect(handler(error)).rejects.toBe(error);
    expect(doRefresh).not.toHaveBeenCalled();
  });

  it('ignores 401 on /auth/refresh (default skipUrl)', async () => {
    setup();
    const handler = mockClient.getErrorHandler();
    const error = mockClient.createError(401, '/auth/refresh');

    await expect(handler(error)).rejects.toBe(error);
    expect(doRefresh).not.toHaveBeenCalled();
  });

  it('calls doRefresh on normal 401', async () => {
    doRefresh.mockResolvedValue(true);
    const { clientFn } = setup();
    const handler = mockClient.getErrorHandler();
    const error = mockClient.createError(401, '/api/resource');

    clientFn.mockResolvedValue({ data: 'retried' });

    await handler(error);

    expect(doRefresh).toHaveBeenCalledOnce();
  });

  it('retries original request after successful refresh', async () => {
    doRefresh.mockResolvedValue(true);
    const { clientFn } = setup();
    const handler = mockClient.getErrorHandler();
    const error = mockClient.createError(401, '/api/resource');

    clientFn.mockResolvedValue({ data: 'retried' });

    const result = await handler(error);

    expect(clientFn).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/api/resource', _retry: true }),
    );
    expect(result).toEqual({ data: 'retried' });
  });

  it('calls onRetry before retrying request', async () => {
    doRefresh.mockResolvedValue(true);
    const { clientFn } = setup();
    const handler = mockClient.getErrorHandler();
    const error = mockClient.createError(401, '/api/resource');

    clientFn.mockResolvedValue({ data: 'retried' });

    await handler(error);

    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ url: '/api/resource' }));
    // onRetry should be called before the client retry
    expect(onRetry.mock.invocationCallOrder[0]).toBeLessThan(clientFn.mock.invocationCallOrder[0]);
  });

  it('calls onRefreshFail when doRefresh returns false', async () => {
    doRefresh.mockResolvedValue(false);
    setup();
    const handler = mockClient.getErrorHandler();
    const error = mockClient.createError(401, '/api/resource');

    await expect(handler(error)).rejects.toBe(error);
    expect(onRefreshFail).toHaveBeenCalledOnce();
  });

  it('coalesces concurrent 401s into a single doRefresh call', async () => {
    let resolveRefresh!: (value: boolean) => void;
    doRefresh.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    const { clientFn } = setup();
    const handler = mockClient.getErrorHandler();

    clientFn.mockResolvedValue({ data: 'retried' });

    const error1 = mockClient.createError(401, '/api/resource-1');
    const error2 = mockClient.createError(401, '/api/resource-2');

    const p1 = handler(error1);
    const p2 = handler(error2);

    resolveRefresh(true);

    await Promise.all([p1, p2]);

    expect(doRefresh).toHaveBeenCalledOnce();
  });

  it('does not retry a request already marked with _retry=true', async () => {
    setup();
    const handler = mockClient.getErrorHandler();
    const error = mockClient.createError(401, '/api/resource', { _retry: true } as never);

    await expect(handler(error)).rejects.toBe(error);
    expect(doRefresh).not.toHaveBeenCalled();
  });

  it('respects custom skipUrls', async () => {
    setup(['/custom/skip']);
    const handler = mockClient.getErrorHandler();

    // Custom skip URL should be skipped
    const skippedError = mockClient.createError(401, '/custom/skip');
    await expect(handler(skippedError)).rejects.toBe(skippedError);

    // Default /auth/login should NOT be skipped when custom skipUrls override
    doRefresh.mockResolvedValue(false);
    const loginError = mockClient.createError(401, '/auth/login');
    await expect(handler(loginError)).rejects.toBe(loginError);

    // doRefresh called once for /auth/login since it's no longer in skipUrls
    expect(doRefresh).toHaveBeenCalledOnce();
  });
});
