import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // staleTime: per-hook (dashboard 2min, rest default 0 = always fresh on mount)
      retry: 1,
    },
  },
});
