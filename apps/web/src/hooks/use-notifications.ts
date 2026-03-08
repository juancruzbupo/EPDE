import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { QUERY_KEYS, getErrorMessage } from '@epde/shared';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '@/lib/api/notifications';

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
    queryKey: [QUERY_KEYS.notifications, QUERY_KEYS.notificationsUnreadCount],
    queryFn: async ({ signal }) => {
      const res = await getUnreadCount(signal);
      return res.data.count;
    },
    refetchInterval: 30_000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: [QUERY_KEYS.notifications, QUERY_KEYS.notificationsUnreadCount],
      });
      const prev = queryClient.getQueryData<number>([
        QUERY_KEYS.notifications,
        QUERY_KEYS.notificationsUnreadCount,
      ]);
      queryClient.setQueryData<number>(
        [QUERY_KEYS.notifications, QUERY_KEYS.notificationsUnreadCount],
        (old) => (old && old > 0 ? old - 1 : 0),
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      toast.error(getErrorMessage(_err, 'Error al marcar notificación'));
      if (context?.prev !== undefined) {
        queryClient.setQueryData(
          [QUERY_KEYS.notifications, QUERY_KEYS.notificationsUnreadCount],
          context.prev,
        );
      }
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
      await queryClient.cancelQueries({
        queryKey: [QUERY_KEYS.notifications, QUERY_KEYS.notificationsUnreadCount],
      });
      const prev = queryClient.getQueryData<number>([
        QUERY_KEYS.notifications,
        QUERY_KEYS.notificationsUnreadCount,
      ]);
      queryClient.setQueryData([QUERY_KEYS.notifications, QUERY_KEYS.notificationsUnreadCount], 0);
      return { prev };
    },
    onError: (_err, _vars, context) => {
      toast.error(getErrorMessage(_err, 'Error al marcar notificaciones'));
      if (context?.prev !== undefined) {
        queryClient.setQueryData(
          [QUERY_KEYS.notifications, QUERY_KEYS.notificationsUnreadCount],
          context.prev,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.notifications] });
    },
  });
}
