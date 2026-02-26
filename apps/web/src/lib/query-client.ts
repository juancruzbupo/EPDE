import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      // gcTime: default 5 min (web no necesita offline cache; mobile usa 24h)
      retry: 1,
    },
  },
});
