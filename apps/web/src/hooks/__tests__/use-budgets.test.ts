import { renderHook } from '@testing-library/react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { QUERY_KEYS, getErrorMessage } from '@epde/shared';
import {
  useBudgets,
  useBudget,
  useCreateBudgetRequest,
  useRespondToBudget,
  useUpdateBudgetStatus,
} from '../use-budgets';

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

vi.mock('@/lib/api/budgets', () => ({
  getBudgets: vi.fn(),
  getBudget: vi.fn(),
  createBudgetRequest: vi.fn(),
  respondToBudget: vi.fn(),
  updateBudgetStatus: vi.fn(),
}));

describe('useBudgets', () => {
  const mockInfiniteQueryReturn = { data: undefined, isLoading: true };

  beforeEach(() => {
    vi.mocked(useInfiniteQuery).mockReturnValue(
      mockInfiniteQueryReturn as ReturnType<typeof useInfiniteQuery>,
    );
  });

  it('should call useInfiniteQuery with correct queryKey', () => {
    const filters = { status: 'PENDING' };
    renderHook(() => useBudgets(filters));

    expect(useInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.budgets, filters],
      }),
    );
  });

  it('should pass getNextPageParam that extracts nextCursor', () => {
    renderHook(() => useBudgets({}));

    const config = vi.mocked(useInfiniteQuery).mock.calls[0][0];
    const getNextPageParam = config.getNextPageParam as (lastPage: {
      nextCursor: string | null;
    }) => string | undefined;

    expect(getNextPageParam({ nextCursor: 'cursor-123' })).toBe('cursor-123');
    expect(getNextPageParam({ nextCursor: null })).toBeUndefined();
  });
});

describe('useBudget', () => {
  const mockQueryReturn = { data: undefined, isLoading: true };

  beforeEach(() => {
    vi.mocked(useQuery).mockReturnValue(mockQueryReturn as ReturnType<typeof useQuery>);
  });

  it('should call useQuery with correct queryKey', () => {
    renderHook(() => useBudget('budget-1'));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.budgets, 'budget-1'],
        enabled: true,
      }),
    );
  });

  it('should accept initialData option', () => {
    const initialData = { id: 'budget-1', title: 'Test' };
    renderHook(() => useBudget('budget-1', { initialData: initialData as never }));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        initialData,
      }),
    );
  });
});

describe('useCreateBudgetRequest', () => {
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

  it('should invalidate budgets and dashboard queries on success', () => {
    renderHook(() => useCreateBudgetRequest());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.budgets] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardStats],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardActivity],
    });
  });

  it('should show success toast on success', () => {
    renderHook(() => useCreateBudgetRequest());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(toast.success).toHaveBeenCalledWith('Presupuesto creado');
  });

  it('should show error toast via getErrorMessage on error', () => {
    renderHook(() => useCreateBudgetRequest());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    const error = new Error('Network error');
    (config.onError as (err: Error) => void)(error);

    expect(getErrorMessage).toHaveBeenCalledWith(error, 'Error al crear presupuesto');
    expect(toast.error).toHaveBeenCalled();
  });
});

describe('useRespondToBudget', () => {
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

  it('should invalidate budgets queries on success', () => {
    renderHook(() => useRespondToBudget());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.budgets] });
    expect(toast.success).toHaveBeenCalledWith('Cotización enviada');
  });
});

describe('useUpdateBudgetStatus', () => {
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

  it('should invalidate budgets and dashboard queries on success', () => {
    renderHook(() => useUpdateBudgetStatus());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.budgets] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardStats],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardActivity],
    });
    expect(toast.success).toHaveBeenCalledWith('Estado actualizado');
  });
});
