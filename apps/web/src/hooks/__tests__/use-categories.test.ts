import { renderHook } from '@testing-library/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { QUERY_KEYS, getErrorMessage } from '@epde/shared';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../use-categories';

vi.mock('@tanstack/react-query', () => ({
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

vi.mock('@/lib/api/categories', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

describe('useCategories', () => {
  beforeEach(() => {
    vi.mocked(useQuery).mockReturnValue({ data: undefined, isLoading: true } as ReturnType<
      typeof useQuery
    >);
  });

  it('should call useQuery with correct queryKey', () => {
    renderHook(() => useCategories());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.categories],
      }),
    );
  });
});

describe('useCreateCategory', () => {
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

  it('should invalidate categories and show toast on success', () => {
    renderHook(() => useCreateCategory());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(toast.success).toHaveBeenCalledWith('Categoría creada');
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.categories] });
  });

  it('should show error toast on error', () => {
    renderHook(() => useCreateCategory());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    const error = new Error('fail');
    (config.onError as (err: Error) => void)(error);

    expect(getErrorMessage).toHaveBeenCalledWith(error, 'Error al crear categoría');
    expect(toast.error).toHaveBeenCalled();
  });
});

describe('useUpdateCategory', () => {
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

  it('should invalidate categories and show toast on success', () => {
    renderHook(() => useUpdateCategory());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(toast.success).toHaveBeenCalledWith('Categoría actualizada');
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.categories] });
  });

  it('should show error toast on error', () => {
    renderHook(() => useUpdateCategory());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    const error = new Error('fail');
    (config.onError as (err: Error) => void)(error);

    expect(getErrorMessage).toHaveBeenCalledWith(error, 'Error al actualizar categoría');
    expect(toast.error).toHaveBeenCalled();
  });
});

describe('useDeleteCategory', () => {
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

  it('should invalidate categories and show toast on success', () => {
    renderHook(() => useDeleteCategory());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(toast.success).toHaveBeenCalledWith('Categoría eliminada');
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.categories] });
  });

  it('should show error toast on error', () => {
    renderHook(() => useDeleteCategory());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    const error = new Error('fail');
    (config.onError as (err: Error) => void)(error);

    expect(getErrorMessage).toHaveBeenCalledWith(error, 'Error al eliminar categoría');
    expect(toast.error).toHaveBeenCalled();
  });
});
