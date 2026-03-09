import { QUERY_KEYS } from '@epde/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';

import {
  useCategoryTemplates,
  useCreateCategoryTemplate,
  useCreateTaskTemplate,
  useDeleteCategoryTemplate,
  useDeleteTaskTemplate,
  useUpdateCategoryTemplate,
  useUpdateTaskTemplate,
} from '../use-category-templates';

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

vi.mock('@/lib/api/category-templates', () => ({
  getCategoryTemplates: vi.fn(),
  createCategoryTemplate: vi.fn(),
  updateCategoryTemplate: vi.fn(),
  deleteCategoryTemplate: vi.fn(),
  createTaskTemplate: vi.fn(),
  updateTaskTemplate: vi.fn(),
  deleteTaskTemplate: vi.fn(),
}));

const mockQueryReturn = { data: undefined, isLoading: true };
const mockMutationReturn = { mutate: vi.fn(), mutateAsync: vi.fn() };

const mockInvalidateQueries = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useQuery).mockReturnValue(mockQueryReturn as ReturnType<typeof useQuery>);
  vi.mocked(useMutation).mockReturnValue(
    mockMutationReturn as unknown as ReturnType<typeof useMutation>,
  );
  vi.mocked(useQueryClient).mockReturnValue({
    invalidateQueries: mockInvalidateQueries,
  } as unknown as ReturnType<typeof useQueryClient>);
});

describe('useCategoryTemplates', () => {
  it('calls useQuery with correct queryKey', () => {
    renderHook(() => useCategoryTemplates());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.categoryTemplates],
      }),
    );
  });
});

describe('useCreateCategoryTemplate', () => {
  it('invalidates categoryTemplates on success', () => {
    renderHook(() => useCreateCategoryTemplate());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.categoryTemplates],
    });
  });
});

describe('useUpdateCategoryTemplate', () => {
  it('invalidates categoryTemplates on success', () => {
    renderHook(() => useUpdateCategoryTemplate());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.categoryTemplates],
    });
  });
});

describe('useDeleteCategoryTemplate', () => {
  it('invalidates categoryTemplates on success', () => {
    renderHook(() => useDeleteCategoryTemplate());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.categoryTemplates],
    });
  });
});

describe('useCreateTaskTemplate', () => {
  it('invalidates categoryTemplates on success', () => {
    renderHook(() => useCreateTaskTemplate());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.categoryTemplates],
    });
  });
});

describe('useUpdateTaskTemplate', () => {
  it('invalidates categoryTemplates on success', () => {
    renderHook(() => useUpdateTaskTemplate());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.categoryTemplates],
    });
  });
});

describe('useDeleteTaskTemplate', () => {
  it('invalidates categoryTemplates on success', () => {
    renderHook(() => useDeleteTaskTemplate());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.categoryTemplates],
    });
  });
});
