import { QueryClient } from '@tanstack/react-query';
import { onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

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
      retry: 1,
      refetchOnReconnect: true,
      networkMode: 'offlineFirst',
    },
  },
});
