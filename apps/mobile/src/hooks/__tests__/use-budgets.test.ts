import { renderHook } from '@testing-library/react-native';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { QUERY_KEYS } from '@epde/shared';
import {
  useBudgets,
  useBudget,
  useCreateBudgetRequest,
  useUpdateBudgetStatus,
} from '../use-budgets';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: jest.fn(),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
}));

jest.mock('@/lib/api/budgets', () => ({
  getBudgets: jest.fn(),
  getBudget: jest.fn(),
  createBudgetRequest: jest.fn(),
  updateBudgetStatus: jest.fn(),
}));

const mockInfiniteQueryReturn = { data: undefined, isLoading: true };
const mockQueryReturn = { data: undefined, isLoading: true };
const mockMutationReturn = { mutate: jest.fn(), mutateAsync: jest.fn() };

const mockInvalidateQueries = jest.fn();
const mockCancelQueries = jest.fn();
const mockGetQueryData = jest.fn();
const mockSetQueryData = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useInfiniteQuery as jest.Mock).mockReturnValue(mockInfiniteQueryReturn);
  (useQuery as jest.Mock).mockReturnValue(mockQueryReturn);
  (useMutation as jest.Mock).mockReturnValue(mockMutationReturn);
  (useQueryClient as jest.Mock).mockReturnValue({
    invalidateQueries: mockInvalidateQueries,
    cancelQueries: mockCancelQueries,
    getQueryData: mockGetQueryData,
    setQueryData: mockSetQueryData,
  });
});

// ---------------------------------------------------------------------------
// useBudgets
// ---------------------------------------------------------------------------

describe('useBudgets', () => {
  it('calls useInfiniteQuery with correct queryKey and maxPages', () => {
    const filters = { status: 'PENDING' as const };
    renderHook(() => useBudgets(filters));

    expect(useInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.budgets, filters],
        maxPages: 10,
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// useBudget
// ---------------------------------------------------------------------------

describe('useBudget', () => {
  it('calls useQuery with correct queryKey and enabled', () => {
    renderHook(() => useBudget('budget-1'));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.budgets, 'budget-1'],
        enabled: true,
      }),
    );
  });

  it('disables query when id is empty', () => {
    renderHook(() => useBudget(''));

    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });
});

// ---------------------------------------------------------------------------
// useCreateBudgetRequest
// ---------------------------------------------------------------------------

describe('useCreateBudgetRequest', () => {
  it('invalidates budgets and dashboard on success', () => {
    renderHook(() => useCreateBudgetRequest());

    const config = (useMutation as jest.Mock).mock.calls[0][0];
    config.onSuccess();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.budgets],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientStats],
    });
  });

  it('shows Alert on error', () => {
    renderHook(() => useCreateBudgetRequest());

    const config = (useMutation as jest.Mock).mock.calls[0][0];
    config.onError(new Error('fail'));

    expect(Alert.alert).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// useUpdateBudgetStatus
// ---------------------------------------------------------------------------

describe('useUpdateBudgetStatus', () => {
  it('applies optimistic update in onMutate', async () => {
    const previous = { id: 'b-1', status: 'PENDING' };
    mockGetQueryData.mockReturnValue(previous);
    mockCancelQueries.mockResolvedValue(undefined);

    renderHook(() => useUpdateBudgetStatus());

    const config = (useMutation as jest.Mock).mock.calls[0][0];
    await config.onMutate({ id: 'b-1', status: 'APPROVED' });

    expect(mockCancelQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.budgets, 'b-1'],
    });
    expect(mockSetQueryData).toHaveBeenCalledWith(
      [QUERY_KEYS.budgets, 'b-1'],
      expect.any(Function),
    );
  });

  it('rolls back optimistic update on error', () => {
    const previous = { id: 'b-1', status: 'PENDING' };
    renderHook(() => useUpdateBudgetStatus());

    const config = (useMutation as jest.Mock).mock.calls[0][0];
    config.onError(new Error('fail'), { id: 'b-1', status: 'APPROVED' }, { previous });

    expect(mockSetQueryData).toHaveBeenCalledWith([QUERY_KEYS.budgets, 'b-1'], previous);
    expect(Alert.alert).toHaveBeenCalled();
  });

  it('invalidates budgets and dashboard on settled', () => {
    renderHook(() => useUpdateBudgetStatus());

    const config = (useMutation as jest.Mock).mock.calls[0][0];
    config.onSettled();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.budgets],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientStats],
    });
  });
});
