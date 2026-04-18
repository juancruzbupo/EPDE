import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useMilestones, useStreakFreeze } from '../use-milestones';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('@/lib/api/auth-features', () => ({
  getMilestones: jest.fn(),
  activateStreakFreeze: jest.fn(),
}));

jest.mock('@/lib/toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/lib/haptics', () => ({
  haptics: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/lib/invalidate-dashboard', () => ({
  invalidateDashboard: jest.fn(),
}));

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
const mockUseQueryClient = useQueryClient as jest.MockedFunction<typeof useQueryClient>;

describe('useMilestones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: jest.fn(),
    } as unknown as ReturnType<typeof useQueryClient>);
  });

  it('calls useQuery with correct query key and staleTime', () => {
    mockUseQuery.mockReturnValue({ data: null, isLoading: false } as unknown as ReturnType<
      typeof useQuery
    >);
    useMilestones();

    const call = mockUseQuery.mock.calls[0]![0] as { queryKey: unknown[]; staleTime: number };
    expect(call.queryKey).toBeDefined();
    expect(call.staleTime).toBeGreaterThan(0);
  });
});

describe('useStreakFreeze', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: jest.fn(),
    } as unknown as ReturnType<typeof useQueryClient>);
    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useMutation>);
  });

  it('registers onSuccess and onError handlers', () => {
    useStreakFreeze();
    const call = mockUseMutation.mock.calls[0]![0] as {
      onSuccess: () => void;
      onError: (err: Error) => void;
    };
    expect(typeof call.onSuccess).toBe('function');
    expect(typeof call.onError).toBe('function');
  });

  it('onSuccess triggers haptics, toast, and dashboard invalidation', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { haptics } = require('@/lib/haptics');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { toast } = require('@/lib/toast');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { invalidateDashboard } = require('@/lib/invalidate-dashboard');

    useStreakFreeze();
    const call = mockUseMutation.mock.calls[0]![0] as { onSuccess: () => void };
    call.onSuccess();

    expect(haptics.success).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
    expect(invalidateDashboard).toHaveBeenCalled();
  });

  it('onError triggers error haptics and error toast', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { haptics } = require('@/lib/haptics');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { toast } = require('@/lib/toast');

    useStreakFreeze();
    const call = mockUseMutation.mock.calls[0]![0] as { onError: (err: Error) => void };
    call.onError(new Error('network'));

    expect(haptics.error).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });
});
