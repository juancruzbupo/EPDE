import NetInfo from '@react-native-community/netinfo';
import { QueryClient } from '@tanstack/react-query';
import { onlineManager } from '@tanstack/react-query';

// Sync online/offline status with React Query
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60_000, // 2 minutes
      gcTime: 24 * 60 * 60_000, // 24 hours — offline support
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status && status < 500) return false;
        return failureCount < 1;
      },
      refetchOnReconnect: true,
      networkMode: 'offlineFirst',
    },
  },
});
