import { renderHook } from '@testing-library/react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@epde/shared';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from '../use-notifications';

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

vi.mock('@/lib/api/notifications', () => ({
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
}));

describe('useNotifications', () => {
  beforeEach(() => {
    vi.mocked(useInfiniteQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useInfiniteQuery>);
  });

  it('should call useInfiniteQuery with correct queryKey', () => {
    renderHook(() => useNotifications());

    expect(useInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.notifications],
      }),
    );
  });

  it('should pass getNextPageParam that extracts nextCursor', () => {
    renderHook(() => useNotifications());

    const config = vi.mocked(useInfiniteQuery).mock.calls[0][0];
    const getNextPageParam = config.getNextPageParam as (lastPage: {
      nextCursor: string | null;
    }) => string | undefined;

    expect(getNextPageParam({ nextCursor: 'cursor-abc' })).toBe('cursor-abc');
    expect(getNextPageParam({ nextCursor: null })).toBeUndefined();
  });
});

describe('useUnreadCount', () => {
  beforeEach(() => {
    vi.mocked(useQuery).mockReturnValue({ data: undefined, isLoading: true } as ReturnType<
      typeof useQuery
    >);
  });

  it('should use correct queryKey with unread sub-key', () => {
    renderHook(() => useUnreadCount());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.notifications, QUERY_KEYS.notificationsUnreadCount],
        refetchInterval: 30_000,
      }),
    );
  });
});

describe('useMarkAsRead', () => {
  const mockInvalidateQueries = vi.fn();
  const mockCancelQueries = vi.fn();
  const mockGetQueryData = vi.fn();
  const mockSetQueryData = vi.fn();

  beforeEach(() => {
    vi.mocked(useQueryClient).mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
      cancelQueries: mockCancelQueries,
      getQueryData: mockGetQueryData,
      setQueryData: mockSetQueryData,
    } as unknown as ReturnType<typeof useQueryClient>);
    vi.mocked(useMutation).mockReturnValue({ mutate: vi.fn() } as unknown as ReturnType<
      typeof useMutation
    >);
  });

  afterEach(() => vi.clearAllMocks());

  it('should optimistically decrement unread count', async () => {
    mockGetQueryData.mockReturnValue(5);
    renderHook(() => useMarkAsRead());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    await (config.onMutate as () => Promise<{ prev: number }>)();

    expect(mockCancelQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.notifications, QUERY_KEYS.notificationsUnreadCount],
    });
    expect(mockSetQueryData).toHaveBeenCalledWith(
      [QUERY_KEYS.notifications, QUERY_KEYS.notificationsUnreadCount],
      4,
    );
  });

  it('should rollback on error', () => {
    renderHook(() => useMarkAsRead());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    const error = new Error('fail');
    (config.onError as (err: Error, id: string, context?: { prev: number }) => void)(
      error,
      'notif-1',
      { prev: 5 },
    );

    expect(mockSetQueryData).toHaveBeenCalledWith(
      [QUERY_KEYS.notifications, QUERY_KEYS.notificationsUnreadCount],
      5,
    );
    expect(toast.error).toHaveBeenCalled();
  });

  it('should invalidate notifications on settled', () => {
    renderHook(() => useMarkAsRead());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    (config.onSettled as () => void)();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.notifications],
    });
  });
});

describe('useMarkAllAsRead', () => {
  const mockInvalidateQueries = vi.fn();
  const mockCancelQueries = vi.fn();
  const mockGetQueryData = vi.fn();
  const mockSetQueryData = vi.fn();

  beforeEach(() => {
    vi.mocked(useQueryClient).mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
      cancelQueries: mockCancelQueries,
      getQueryData: mockGetQueryData,
      setQueryData: mockSetQueryData,
    } as unknown as ReturnType<typeof useQueryClient>);
    vi.mocked(useMutation).mockReturnValue({ mutate: vi.fn() } as unknown as ReturnType<
      typeof useMutation
    >);
  });

  afterEach(() => vi.clearAllMocks());

  it('should optimistically set unread count to 0', async () => {
    mockGetQueryData.mockReturnValue(10);
    renderHook(() => useMarkAllAsRead());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    await (config.onMutate as () => Promise<{ prev: number }>)();

    expect(mockSetQueryData).toHaveBeenCalledWith(
      [QUERY_KEYS.notifications, QUERY_KEYS.notificationsUnreadCount],
      0,
    );
  });

  it('should rollback on error', () => {
    renderHook(() => useMarkAllAsRead());

    const config = vi.mocked(useMutation).mock.calls[0][0];
    const error = new Error('fail');
    (config.onError as (err: Error, vars: unknown, context?: { prev: number }) => void)(
      error,
      undefined,
      { prev: 10 },
    );

    expect(mockSetQueryData).toHaveBeenCalledWith(
      [QUERY_KEYS.notifications, QUERY_KEYS.notificationsUnreadCount],
      10,
    );
    expect(toast.error).toHaveBeenCalled();
  });
});
