import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60_000, // 2 min — avoid refetch on every mount (aligned with mobile)
      retry: 1,
    },
  },
});
