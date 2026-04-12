/**
 * Mobile query client — offline-first configuration.
 *
 * - `gcTime: 6h`: Cached data survives app close; persisted to AsyncStorage
 *   via `createAsyncStoragePersister` in the root layout.
 * - `networkMode: 'offlineFirst'`: Serves stale cache immediately, then
 *   revalidates in the background when network is available.
 * - `refetchOnReconnect: true`: Automatically refreshes all active queries
 *   when the device regains connectivity.
 * - `staleTime: 2min`: Same as web — prevents unnecessary refetches.
 *
 * Individual hooks do NOT override these defaults (DRY). All query hooks
 * benefit from offline support without additional configuration.
 */
import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';

// Sync online/offline status with React Query
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

// Refetch stale queries when app returns to foreground
focusManager.setEventListener((setFocused) => {
  const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
    setFocused(state === 'active');
  });
  return () => sub.remove();
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60_000, // 2 minutes
      gcTime: 6 * 60 * 60_000, // 6 hours — balanced offline support vs storage pressure
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        // Retry 429 (rate-limited) and 503 (service unavailable) with backoff
        if (status === 429 || status === 503) return failureCount < 2;
        // Skip all other client errors (4xx)
        if (status && status < 500) return false;
        // Retry server errors once
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnReconnect: true,
      networkMode: 'offlineFirst',
    },
  },
});
