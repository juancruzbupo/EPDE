import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { toast } from 'sonner';

import {
  useClient,
  useClients,
  useCreateClient,
  useDeleteClient,
  useUpdateClient,
} from '../use-clients';

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

vi.mock('./use-debounce', () => ({
  useDebounce: vi.fn((val: string) => val),
}));

vi.mock('@/lib/api/clients', () => ({
  getClients: vi.fn(),
  getClient: vi.fn(),
  createClient: vi.fn(),
  updateClient: vi.fn(),
  deleteClient: vi.fn(),
}));

describe('useClients', () => {
  beforeEach(() => {
    vi.mocked(useInfiniteQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useInfiniteQuery>);
  });

  it('should call useInfiniteQuery with correct queryKey', () => {
    const filters = { search: 'test' };
    renderHook(() => useClients(filters));

    expect(useInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.clients, filters],
      }),
    );
  });

  it('should pass getNextPageParam that extracts nextCursor', () => {
    renderHook(() => useClients({}));

    const config = vi.mocked(useInfiniteQuery).mock.calls[0][0];
    const getNextPageParam = config.getNextPageParam as (lastPage: {
      nextCursor: string | null;
    }) => string | undefined;

    expect(getNextPageParam({ nextCursor: 'cursor-abc' })).toBe('cursor-abc');
    expect(getNextPageParam({ nextCursor: null })).toBeUndefined();
  });
});

describe('useClient', () => {
  beforeEach(() => {
    vi.mocked(useQuery).mockReturnValue({ data: undefined, isLoading: true } as ReturnType<
      typeof useQuery
    >);
  });

  it('should call useQuery with correct queryKey', () => {
    renderHook(() => useClient('client-1'));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.clients, 'client-1'],
        enabled: true,
      }),
    );
  });

  it('should be disabled when id is empty', () => {
    renderHook(() => useClient(''));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });
});

describe('useCreateClient', () => {
  const mockInvalidateQueries = vi.fn();

  beforeEach(() => {
    vi.mocked(useQueryClient).mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
    vi.mocked(useMutation).mockReturnValue({ mutate: vi.fn() } as unknown as ReturnType<
      typeof useMutation
    >);
  });

  afterEach(() => vi.clearAllMocks());

  it('should invalidate clients and show toast on success', () => {
    renderHook(() => useCreateClient());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(toast.success).toHaveBeenCalledWith('Cliente creado');
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.clients] });
  });

  it('should show error toast on error', () => {
    renderHook(() => useCreateClient());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    const error = new Error('fail');
    (config.onError as (err: Error) => void)(error);

    expect(getErrorMessage).toHaveBeenCalledWith(error, 'Error al crear cliente');
    expect(toast.error).toHaveBeenCalled();
  });
});

describe('useUpdateClient', () => {
  const mockInvalidateQueries = vi.fn();

  beforeEach(() => {
    vi.mocked(useQueryClient).mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
    vi.mocked(useMutation).mockReturnValue({ mutate: vi.fn() } as unknown as ReturnType<
      typeof useMutation
    >);
  });

  afterEach(() => vi.clearAllMocks());

  it('should invalidate clients and show toast on success', () => {
    renderHook(() => useUpdateClient());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(toast.success).toHaveBeenCalledWith('Cliente actualizado');
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.clients] });
  });

  it('should show error toast on error', () => {
    renderHook(() => useUpdateClient());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    const error = new Error('fail');
    (config.onError as (err: Error) => void)(error);

    expect(getErrorMessage).toHaveBeenCalledWith(error, 'Error al actualizar cliente');
    expect(toast.error).toHaveBeenCalled();
  });
});

describe('useDeleteClient', () => {
  const mockInvalidateQueries = vi.fn();

  beforeEach(() => {
    vi.mocked(useQueryClient).mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
    vi.mocked(useMutation).mockReturnValue({ mutate: vi.fn() } as unknown as ReturnType<
      typeof useMutation
    >);
  });

  afterEach(() => vi.clearAllMocks());

  it('should invalidate clients and show toast on success', () => {
    renderHook(() => useDeleteClient());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(toast.success).toHaveBeenCalledWith('Cliente eliminado');
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.clients] });
  });

  it('should show error toast on error', () => {
    renderHook(() => useDeleteClient());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    const error = new Error('fail');
    (config.onError as (err: Error) => void)(error);

    expect(getErrorMessage).toHaveBeenCalledWith(error, 'Error al eliminar cliente');
    expect(toast.error).toHaveBeenCalled();
  });
});
