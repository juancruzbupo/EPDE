import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60_000, // 2 min — avoid refetch on every mount (aligned with mobile)
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status && status < 500) return false;
        return failureCount < 1;
      },
    },
  },
});
