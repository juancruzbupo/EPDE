import { renderHook } from '@testing-library/react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { QUERY_KEYS } from '@epde/shared';
import {
  usePlans,
  useAllTasks,
  usePlan,
  useCompleteTask,
  useAddTaskNote,
} from '../use-maintenance-plans';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
}));

jest.mock('@/lib/api/maintenance-plans', () => ({
  getPlans: jest.fn(),
  getAllTasks: jest.fn(),
  getPlan: jest.fn(),
  getTaskDetail: jest.fn(),
  getTaskLogs: jest.fn(),
  getTaskNotes: jest.fn(),
  completeTask: jest.fn(),
  addTaskNote: jest.fn(),
}));

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: {
    getState: jest.fn().mockReturnValue({ user: { id: 'user-1', name: 'Test User' } }),
  },
}));

const mockQueryReturn = { data: undefined, isLoading: true };
const mockMutationReturn = { mutate: jest.fn(), mutateAsync: jest.fn() };

const mockInvalidateQueries = jest.fn();
const mockCancelQueries = jest.fn();
const mockGetQueryData = jest.fn();
const mockSetQueryData = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
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
// usePlans
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// useAllTasks
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// usePlan
// ---------------------------------------------------------------------------

describe('usePlan', () => {
  it('calls useQuery with planId in queryKey and enabled=true', () => {
    renderHook(() => usePlan('plan-1'));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.plans, 'plan-1'],
        enabled: true,
      }),
    );
  });

  it('disables query when id is empty string', () => {
    renderHook(() => usePlan(''));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// useCompleteTask
// ---------------------------------------------------------------------------

describe('useCompleteTask', () => {
  it('invalidates plan, dashboard, and task queries on settled', () => {
    renderHook(() => useCompleteTask());

    const config = (useMutation as jest.Mock).mock.calls[0][0];
    const variables = {
      planId: 'plan-1',
      taskId: 'task-1',
      result: 'OK',
      conditionFound: 'GOOD',
      executor: 'OWNER',
      actionTaken: 'INSPECTION_ONLY',
    };

    config.onSettled(undefined, null, variables);

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.plans, 'plan-1'],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientStats],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.taskLogs, 'plan-1', 'task-1'],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.taskDetail, 'plan-1', 'task-1'],
    });
  });

  it('rolls back optimistic update on error', () => {
    const previousPlan = { id: 'plan-1', tasks: [{ id: 'task-1', status: 'PENDING' }] };
    renderHook(() => useCompleteTask());

    const config = (useMutation as jest.Mock).mock.calls[0][0];
    const variables = { planId: 'plan-1', taskId: 'task-1' };

    config.onError(new Error('fail'), variables, { previousPlan });

    expect(mockSetQueryData).toHaveBeenCalledWith([QUERY_KEYS.plans, 'plan-1'], previousPlan);
    expect(Alert.alert).toHaveBeenCalled();
  });

  it('applies optimistic update in onMutate', async () => {
    const currentPlan = { id: 'plan-1', tasks: [{ id: 'task-1', status: 'PENDING' }] };
    mockGetQueryData.mockReturnValue(currentPlan);
    mockCancelQueries.mockResolvedValue(undefined);

    renderHook(() => useCompleteTask());

    const config = (useMutation as jest.Mock).mock.calls[0][0];
    const variables = { planId: 'plan-1', taskId: 'task-1' };

    await config.onMutate(variables);

    expect(mockCancelQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.plans, 'plan-1'],
    });
    expect(mockSetQueryData).toHaveBeenCalledWith(
      [QUERY_KEYS.plans, 'plan-1'],
      expect.any(Function),
    );
  });
});

// ---------------------------------------------------------------------------
// useAddTaskNote
// ---------------------------------------------------------------------------

describe('useAddTaskNote', () => {
  it('invalidates task notes and detail on settled', () => {
    renderHook(() => useAddTaskNote());

    const config = (useMutation as jest.Mock).mock.calls[0][0];
    const variables = { planId: 'plan-1', taskId: 'task-1', content: 'Test note' };

    config.onSettled(undefined, null, variables);

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.taskNotes, 'plan-1', 'task-1'],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.taskDetail, 'plan-1', 'task-1'],
    });
  });

  it('rolls back optimistic note on error', () => {
    const previousNotes = [{ id: 'note-1', content: 'Old note' }];
    renderHook(() => useAddTaskNote());

    const config = (useMutation as jest.Mock).mock.calls[0][0];
    const variables = { planId: 'plan-1', taskId: 'task-1', content: 'New note' };

    config.onError(new Error('fail'), variables, { previousNotes });

    expect(mockSetQueryData).toHaveBeenCalledWith(
      [QUERY_KEYS.taskNotes, 'plan-1', 'task-1'],
      previousNotes,
    );
    expect(Alert.alert).toHaveBeenCalled();
  });
});
