import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60_000, // 2 min — avoid refetch on every mount (aligned with mobile)
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        // Retry 429 (rate-limited) and 503 (service unavailable) with backoff
        if (status === 429 || status === 503) return failureCount < 2;
        // Skip all other client errors
        if (status && status < 500) return false;
        // Retry server errors once
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
