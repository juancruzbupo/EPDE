import { getErrorMessage, QUERY_KEYS, ServiceStatus } from '@epde/shared';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { toast } from 'sonner';

import {
  useCreateServiceRequest,
  useServiceRequest,
  useServiceRequests,
  useUpdateServiceStatus,
} from '../use-service-requests';

vi.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: vi.fn(),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@epde/shared', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getErrorMessage: vi.fn((_err: unknown, fallback: string) => fallback) };
});

vi.mock('@/lib/api/service-requests', () => ({
  getServiceRequests: vi.fn(),
  getServiceRequest: vi.fn(),
  createServiceRequest: vi.fn(),
  updateServiceStatus: vi.fn(),
}));

const mockInvalidateQueries = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useInfiniteQuery).mockReturnValue({
    data: undefined,
    isLoading: true,
  } as ReturnType<typeof useInfiniteQuery>);
  vi.mocked(useQuery).mockReturnValue({
    data: undefined,
    isLoading: true,
  } as ReturnType<typeof useQuery>);
  vi.mocked(useMutation).mockReturnValue({
    mutate: vi.fn(),
  } as unknown as ReturnType<typeof useMutation>);
  vi.mocked(useQueryClient).mockReturnValue({
    invalidateQueries: mockInvalidateQueries,
  } as unknown as ReturnType<typeof useQueryClient>);
});

describe('useServiceRequests', () => {
  it('calls useInfiniteQuery with correct queryKey and maxPages', () => {
    const filters = { status: ServiceStatus.OPEN };
    renderHook(() => useServiceRequests(filters));

    expect(useInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.serviceRequests, filters],
        maxPages: 10,
      }),
    );
  });
});

describe('useServiceRequest', () => {
  it('calls useQuery with correct queryKey and enabled', () => {
    renderHook(() => useServiceRequest('sr-1'));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.serviceRequests, 'sr-1'],
        enabled: true,
      }),
    );
  });
});

describe('useCreateServiceRequest', () => {
  it('invalidates service-requests and dashboard on success', () => {
    renderHook(() => useCreateServiceRequest());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.serviceRequests],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardStats],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardActivity],
    });
    expect(toast.success).toHaveBeenCalledWith('Solicitud creada');
  });

  it('shows error toast on error', () => {
    renderHook(() => useCreateServiceRequest());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onError as (err: Error) => void)(new Error('fail'));

    expect(getErrorMessage).toHaveBeenCalledWith(expect.any(Error), 'Error al crear solicitud');
    expect(toast.error).toHaveBeenCalled();
  });
});

describe('useUpdateServiceStatus', () => {
  it('invalidates service-requests and dashboard on success', () => {
    renderHook(() => useUpdateServiceStatus());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.serviceRequests],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardStats],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardActivity],
    });
    expect(toast.success).toHaveBeenCalledWith('Estado actualizado');
  });
});
