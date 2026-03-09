import { QUERY_KEYS } from '@epde/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';

import { useAddTask, useAllTasks, usePlan, usePlans, useUpdatePlan } from '../use-plans';

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

vi.mock('@/lib/api/maintenance-plans', () => ({
  getPlans: vi.fn(),
  getAllTasks: vi.fn(),
  getPlan: vi.fn(),
  updatePlan: vi.fn(),
  addTask: vi.fn(),
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

describe('usePlans', () => {
  it('calls useQuery with correct queryKey', () => {
    renderHook(() => usePlans());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.plans, 'list'],
      }),
    );
  });
});

describe('useAllTasks', () => {
  it('uses "all" in queryKey when no status provided', () => {
    renderHook(() => useAllTasks());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.plans, 'tasks', 'all'],
      }),
    );
  });

  it('includes status in queryKey when provided', () => {
    renderHook(() => useAllTasks('PENDING'));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.plans, 'tasks', 'PENDING'],
      }),
    );
  });
});

describe('usePlan', () => {
  it('calls useQuery with planId and enabled', () => {
    renderHook(() => usePlan('plan-1'));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.plans, 'plan-1'],
        enabled: true,
      }),
    );
  });
});

describe('useUpdatePlan', () => {
  it('invalidates plan on success', () => {
    renderHook(() => useUpdatePlan());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as (data: unknown, vars: { id: string }) => void)(undefined, { id: 'p-1' });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.plans, 'p-1'],
    });
  });
});

describe('useAddTask', () => {
  it('invalidates plans on success', () => {
    renderHook(() => useAddTask());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.plans],
    });
  });
});
