import { QUERY_KEYS } from '@epde/shared';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';
import { Alert } from 'react-native';

import {
  useMarkAllAsRead,
  useMarkAsRead,
  useNotifications,
  useUnreadCount,
} from '../use-notifications';

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

jest.mock('@/lib/api/notifications', () => ({
  getNotifications: jest.fn(),
  getUnreadCount: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
}));

const mockMutationReturn = { mutate: jest.fn(), mutateAsync: jest.fn() };
const mockInvalidateQueries = jest.fn();
const mockCancelQueries = jest.fn();
const mockGetQueryData = jest.fn();
const mockSetQueryData = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useInfiniteQuery as jest.Mock).mockReturnValue({ data: undefined, isLoading: true });
  (useQuery as jest.Mock).mockReturnValue({ data: undefined, isLoading: true });
  (useMutation as jest.Mock).mockReturnValue(mockMutationReturn);
  (useQueryClient as jest.Mock).mockReturnValue({
    invalidateQueries: mockInvalidateQueries,
    cancelQueries: mockCancelQueries,
    getQueryData: mockGetQueryData,
    setQueryData: mockSetQueryData,
  });
});

// ---------------------------------------------------------------------------
// useNotifications
// ---------------------------------------------------------------------------

describe('useNotifications', () => {
  it('calls useInfiniteQuery with correct queryKey and maxPages', () => {
    renderHook(() => useNotifications());

    expect(useInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.notifications],
        maxPages: 10,
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// useUnreadCount
// ---------------------------------------------------------------------------

describe('useUnreadCount', () => {
  it('calls useQuery with correct queryKey and refetchInterval', () => {
    renderHook(() => useUnreadCount());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.notifications, QUERY_KEYS.notificationsUnreadCount],
        refetchInterval: 30_000,
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// useMarkAsRead
// ---------------------------------------------------------------------------

describe('useMarkAsRead', () => {
  it('decrements unread count optimistically in onMutate', async () => {
    mockGetQueryData.mockReturnValue(5);
    mockCancelQueries.mockResolvedValue(undefined);

    renderHook(() => useMarkAsRead());

    const config = (useMutation as jest.Mock).mock.calls[0][0];
    await config.onMutate('notif-1');

    expect(mockCancelQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.notifications, QUERY_KEYS.notificationsUnreadCount],
    });
    expect(mockSetQueryData).toHaveBeenCalledWith(
      [QUERY_KEYS.notifications, QUERY_KEYS.notificationsUnreadCount],
      expect.any(Function),
    );
  });

  it('rolls back count on error', () => {
    renderHook(() => useMarkAsRead());

    const config = (useMutation as jest.Mock).mock.calls[0][0];
    config.onError(new Error('fail'), 'notif-1', { previousCount: 5 });

    expect(mockSetQueryData).toHaveBeenCalledWith(
      [QUERY_KEYS.notifications, QUERY_KEYS.notificationsUnreadCount],
      5,
    );
    expect(Alert.alert).toHaveBeenCalled();
  });

  it('invalidates notifications on settled', () => {
    renderHook(() => useMarkAsRead());

    const config = (useMutation as jest.Mock).mock.calls[0][0];
    config.onSettled();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.notifications],
    });
  });
});

// ---------------------------------------------------------------------------
// useMarkAllAsRead
// ---------------------------------------------------------------------------

describe('useMarkAllAsRead', () => {
  it('sets count to 0 optimistically in onMutate', async () => {
    mockGetQueryData.mockReturnValue(10);
    mockCancelQueries.mockResolvedValue(undefined);

    renderHook(() => useMarkAllAsRead());

    const config = (useMutation as jest.Mock).mock.calls[0][0];
    await config.onMutate();

    expect(mockSetQueryData).toHaveBeenCalledWith(
      [QUERY_KEYS.notifications, QUERY_KEYS.notificationsUnreadCount],
      0,
    );
  });

  it('rolls back count on error', () => {
    renderHook(() => useMarkAllAsRead());

    const config = (useMutation as jest.Mock).mock.calls[0][0];
    config.onError(new Error('fail'), undefined, { previousCount: 10 });

    expect(mockSetQueryData).toHaveBeenCalledWith(
      [QUERY_KEYS.notifications, QUERY_KEYS.notificationsUnreadCount],
      10,
    );
    expect(Alert.alert).toHaveBeenCalled();
  });

  it('invalidates notifications on settled', () => {
    renderHook(() => useMarkAllAsRead());

    const config = (useMutation as jest.Mock).mock.calls[0][0];
    config.onSettled();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.notifications],
    });
  });
});
