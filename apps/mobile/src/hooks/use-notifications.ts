import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '@/lib/api/notifications';
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.notifications],
    queryFn: ({ pageParam, signal }) => getNotifications({ cursor: pageParam }, signal),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    maxPages: 10,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: [QUERY_KEYS.notifications, 'unread-count'],
    queryFn: ({ signal }) => getUnreadCount(signal).then((r) => r.data.count),
    refetchInterval: 30_000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markAsRead(id),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.notifications, 'unread-count'] });
      const previousCount = queryClient.getQueryData<number>([
        QUERY_KEYS.notifications,
        'unread-count',
      ]);
      queryClient.setQueryData<number>([QUERY_KEYS.notifications, 'unread-count'], (old) =>
        old && old > 0 ? old - 1 : 0,
      );
      return { previousCount };
    },

    onError: (_err, _id, context) => {
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData([QUERY_KEYS.notifications, 'unread-count'], context.previousCount);
      }
      Alert.alert('Error', getErrorMessage(_err, 'Error al marcar notificación'));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.notifications] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.notifications, 'unread-count'] });
      const previousCount = queryClient.getQueryData<number>([
        QUERY_KEYS.notifications,
        'unread-count',
      ]);
      queryClient.setQueryData<number>([QUERY_KEYS.notifications, 'unread-count'], () => 0);
      return { previousCount };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData([QUERY_KEYS.notifications, 'unread-count'], context.previousCount);
      }
      Alert.alert('Error', getErrorMessage(_err, 'Error al marcar notificaciones'));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.notifications] });
    },
  });
}
