import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { toast } from 'sonner';

import {
  useCreateProperty,
  useDeleteProperty,
  useProperties,
  useProperty,
  useUpdateProperty,
} from '../use-properties';

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

vi.mock('@/lib/api/properties', () => ({
  getProperties: vi.fn(),
  getProperty: vi.fn(),
  createProperty: vi.fn(),
  updateProperty: vi.fn(),
  deleteProperty: vi.fn(),
}));

describe('useProperties', () => {
  const mockInfiniteQueryReturn = { data: undefined, isLoading: true };

  beforeEach(() => {
    vi.mocked(useInfiniteQuery).mockReturnValue(
      mockInfiniteQueryReturn as ReturnType<typeof useInfiniteQuery>,
    );
  });

  it('should call useInfiniteQuery with correct queryKey', () => {
    const filters = { userId: 'user-1' };
    renderHook(() => useProperties(filters));

    expect(useInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.properties, filters],
      }),
    );
  });

  it('should pass getNextPageParam that extracts nextCursor', () => {
    renderHook(() => useProperties({}));

    const config = vi.mocked(useInfiniteQuery).mock.calls[0][0];
    const getNextPageParam = config.getNextPageParam as (lastPage: {
      nextCursor: string | null;
    }) => string | undefined;

    expect(getNextPageParam({ nextCursor: 'cursor-abc' })).toBe('cursor-abc');
    expect(getNextPageParam({ nextCursor: null })).toBeUndefined();
  });
});

describe('useProperty', () => {
  const mockQueryReturn = { data: undefined, isLoading: true };

  beforeEach(() => {
    vi.mocked(useQuery).mockReturnValue(mockQueryReturn as ReturnType<typeof useQuery>);
  });

  it('should call useQuery with correct queryKey', () => {
    renderHook(() => useProperty('property-1'));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.properties, 'property-1'],
        enabled: true,
      }),
    );
  });

  it('should be disabled when id is empty', () => {
    renderHook(() => useProperty(''));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it('should accept initialData option', () => {
    const initialData = { id: 'property-1', address: '123 Test St' };
    renderHook(() => useProperty('property-1', { initialData: initialData as never }));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        initialData,
      }),
    );
  });
});

describe('useCreateProperty', () => {
  const mockInvalidateQueries = vi.fn();

  beforeEach(() => {
    vi.mocked(useQueryClient).mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
    vi.mocked(useMutation).mockReturnValue({ mutate: vi.fn() } as unknown as ReturnType<
      typeof useMutation
    >);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should invalidate properties query on success', () => {
    renderHook(() => useCreateProperty());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.properties] });
  });

  it('should show error toast via getErrorMessage on error', () => {
    renderHook(() => useCreateProperty());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    const error = new Error('Network error');
    (config.onError as (err: Error) => void)(error);

    expect(getErrorMessage).toHaveBeenCalledWith(error, 'Error al crear propiedad');
    expect(toast.error).toHaveBeenCalled();
  });
});

describe('useUpdateProperty', () => {
  const mockInvalidateQueries = vi.fn();

  beforeEach(() => {
    vi.mocked(useQueryClient).mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
    vi.mocked(useMutation).mockReturnValue({ mutate: vi.fn() } as unknown as ReturnType<
      typeof useMutation
    >);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should invalidate properties query on success', () => {
    renderHook(() => useUpdateProperty());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.properties] });
  });

  it('should show error toast via getErrorMessage on error', () => {
    renderHook(() => useUpdateProperty());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    const error = new Error('Update failed');
    (config.onError as (err: Error) => void)(error);

    expect(getErrorMessage).toHaveBeenCalledWith(error, 'Error al actualizar propiedad');
    expect(toast.error).toHaveBeenCalled();
  });
});

describe('useDeleteProperty', () => {
  const mockInvalidateQueries = vi.fn();

  beforeEach(() => {
    vi.mocked(useQueryClient).mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
    vi.mocked(useMutation).mockReturnValue({ mutate: vi.fn() } as unknown as ReturnType<
      typeof useMutation
    >);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should invalidate properties query on success', () => {
    renderHook(() => useDeleteProperty());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.properties] });
  });

  it('should show error toast via getErrorMessage on error', () => {
    renderHook(() => useDeleteProperty());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    const error = new Error('Delete failed');
    (config.onError as (err: Error) => void)(error);

    expect(getErrorMessage).toHaveBeenCalledWith(error, 'Error al eliminar propiedad');
    expect(toast.error).toHaveBeenCalled();
  });
});
