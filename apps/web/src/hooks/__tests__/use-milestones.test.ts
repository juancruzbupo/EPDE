import { QUERY_KEYS } from '@epde/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { toast } from 'sonner';

import { useMilestones, useStreakFreeze } from '../use-milestones';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({ data: undefined, isLoading: true }),
  useMutation: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useQueryClient: vi.fn().mockReturnValue({
    invalidateQueries: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/api/auth-features', () => ({
  getMilestones: vi.fn(),
  activateStreakFreeze: vi.fn(),
}));

vi.mock('@/lib/invalidate-dashboard', () => ({
  invalidateDashboard: vi.fn(),
}));

describe('useMilestones', () => {
  it('calls useQuery with milestones queryKey', () => {
    renderHook(() => useMilestones());
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.milestones],
      }),
    );
  });
});

describe('useStreakFreeze', () => {
  it('calls useMutation and shows success toast on success', () => {
    renderHook(() => useStreakFreeze());
    expect(useMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );

    // Simulate onSuccess
    const { onSuccess } = (useMutation as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    onSuccess();
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('freeze'));
  });

  it('shows error toast on error', () => {
    renderHook(() => useStreakFreeze());
    const { onError } = (useMutation as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    onError(new Error('test'));
    expect(toast.error).toHaveBeenCalled();
  });
});
