import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 24 * 60 * 60 * 1000, // 24 hours — offline support
      retry: 1,
    },
  },
});
