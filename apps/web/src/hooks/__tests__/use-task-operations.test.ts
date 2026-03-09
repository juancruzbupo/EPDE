import { QUERY_KEYS } from '@epde/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { toast } from 'sonner';

import {
  useAddTaskNote,
  useCompleteTask,
  useRemoveTask,
  useTaskDetail,
  useTaskLogs,
  useTaskNotes,
} from '../use-task-operations';

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
  updateTask: vi.fn(),
  removeTask: vi.fn(),
  reorderTasks: vi.fn(),
  getTaskDetail: vi.fn(),
  completeTask: vi.fn(),
  getTaskLogs: vi.fn(),
  getTaskNotes: vi.fn(),
  addTaskNote: vi.fn(),
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: {
    getState: vi.fn().mockReturnValue({ user: { id: 'user-1', name: 'Test User' } }),
  },
}));

const mockQueryReturn = { data: undefined, isLoading: true };
const mockMutationReturn = { mutate: vi.fn(), mutateAsync: vi.fn() };

const mockInvalidateQueries = vi.fn();
const mockCancelQueries = vi.fn();
const mockGetQueryData = vi.fn();
const mockSetQueryData = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useQuery).mockReturnValue(mockQueryReturn as ReturnType<typeof useQuery>);
  vi.mocked(useMutation).mockReturnValue(
    mockMutationReturn as unknown as ReturnType<typeof useMutation>,
  );
  vi.mocked(useQueryClient).mockReturnValue({
    invalidateQueries: mockInvalidateQueries,
    cancelQueries: mockCancelQueries,
    getQueryData: mockGetQueryData,
    setQueryData: mockSetQueryData,
  } as unknown as ReturnType<typeof useQueryClient>);
});

describe('useTaskDetail', () => {
  it('calls useQuery with correct composite queryKey', () => {
    renderHook(() => useTaskDetail('plan-1', 'task-1'));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.taskDetail, 'plan-1', 'task-1'],
        enabled: true,
      }),
    );
  });
});

describe('useTaskLogs', () => {
  it('calls useQuery with correct queryKey', () => {
    renderHook(() => useTaskLogs('plan-1', 'task-1'));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.taskLogs, 'plan-1', 'task-1'],
      }),
    );
  });
});

describe('useTaskNotes', () => {
  it('calls useQuery with correct queryKey', () => {
    renderHook(() => useTaskNotes('plan-1', 'task-1'));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.taskNotes, 'plan-1', 'task-1'],
      }),
    );
  });
});

describe('useRemoveTask', () => {
  it('invalidates plans on success', () => {
    renderHook(() => useRemoveTask());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSuccess as () => void)();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.plans],
    });
  });
});

// ---------------------------------------------------------------------------
// useCompleteTask
// ---------------------------------------------------------------------------

describe('useCompleteTask', () => {
  const variables = {
    planId: 'plan-1',
    taskId: 'task-1',
    result: 'OK' as const,
    conditionFound: 'GOOD' as const,
    executor: 'OWNER' as const,
    actionTaken: 'INSPECTION_ONLY' as const,
  };

  it('applies optimistic update in onMutate', async () => {
    const currentPlan = { id: 'plan-1', tasks: [{ id: 'task-1', status: 'PENDING' }] };
    mockGetQueryData.mockReturnValue(currentPlan);
    mockCancelQueries.mockResolvedValue(undefined);

    renderHook(() => useCompleteTask());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    await (config.onMutate as (v: typeof variables) => Promise<unknown>)(variables);

    expect(mockCancelQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.plans, 'plan-1'],
    });
    expect(mockSetQueryData).toHaveBeenCalledWith(
      [QUERY_KEYS.plans, 'plan-1'],
      expect.any(Function),
    );
  });

  it('rolls back and shows error toast on error', () => {
    const previousPlan = { id: 'plan-1', tasks: [{ id: 'task-1', status: 'PENDING' }] };
    renderHook(() => useCompleteTask());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onError as (err: Error, vars: typeof variables, ctx: unknown) => void)(
      new Error('fail'),
      variables,
      { previousPlan },
    );

    expect(mockSetQueryData).toHaveBeenCalledWith([QUERY_KEYS.plans, 'plan-1'], previousPlan);
    expect(toast.error).toHaveBeenCalled();
  });

  it('invalidates plan, dashboard, and task queries on settled', () => {
    renderHook(() => useCompleteTask());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSettled as (d: unknown, err: unknown, vars: typeof variables) => void)(
      undefined,
      null,
      variables,
    );

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.plans, 'plan-1'],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardStats],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardActivity],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientUpcoming],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.taskLogs, 'plan-1', 'task-1'],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.taskDetail, 'plan-1', 'task-1'],
    });
  });

  it('shows success toast when no error on settled', () => {
    renderHook(() => useCompleteTask());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSettled as (d: unknown, err: unknown, vars: typeof variables) => void)(
      undefined,
      null,
      variables,
    );

    expect(toast.success).toHaveBeenCalledWith('Tarea completada');
  });
});

// ---------------------------------------------------------------------------
// useAddTaskNote
// ---------------------------------------------------------------------------

describe('useAddTaskNote', () => {
  const variables = { planId: 'plan-1', taskId: 'task-1', content: 'Test note' };

  it('invalidates task notes and detail on settled', () => {
    renderHook(() => useAddTaskNote());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSettled as (d: unknown, err: unknown, vars: typeof variables) => void)(
      undefined,
      null,
      variables,
    );

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.taskNotes, 'plan-1', 'task-1'],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.taskDetail, 'plan-1', 'task-1'],
    });
  });

  it('rolls back optimistic note on error', () => {
    const previousNotes = [{ id: 'note-1', content: 'Old' }];
    renderHook(() => useAddTaskNote());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onError as (err: Error, vars: typeof variables, ctx: unknown) => void)(
      new Error('fail'),
      variables,
      { previousNotes },
    );

    expect(mockSetQueryData).toHaveBeenCalledWith(
      [QUERY_KEYS.taskNotes, 'plan-1', 'task-1'],
      previousNotes,
    );
    expect(toast.error).toHaveBeenCalled();
  });
});
