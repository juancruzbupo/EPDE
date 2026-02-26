import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '@/lib/api/notifications';

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam, signal }) => getNotifications({ cursor: pageParam }, signal),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async ({ signal }) => {
      const res = await getUnreadCount(signal);
      return res.data.count;
    },
    refetchInterval: 30000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications', 'unread-count'] });
      const prev = queryClient.getQueryData<number>(['notifications', 'unread-count']);
      if (prev !== undefined) {
        queryClient.setQueryData(['notifications', 'unread-count'], Math.max(0, prev - 1));
      }
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev !== undefined) {
        queryClient.setQueryData(['notifications', 'unread-count'], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications', 'unread-count'] });
      const prev = queryClient.getQueryData<number>(['notifications', 'unread-count']);
      queryClient.setQueryData(['notifications', 'unread-count'], 0);
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev !== undefined) {
        queryClient.setQueryData(['notifications', 'unread-count'], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
