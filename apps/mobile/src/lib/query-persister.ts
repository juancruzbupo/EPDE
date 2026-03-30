import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import Constants from 'expo-constants';

import { QUERY_CACHE_KEY } from './constants';

const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';
const CACHE_KEY = `${QUERY_CACHE_KEY}-v${APP_VERSION}`;

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: CACHE_KEY,
  // Serialize throttle: avoid excessive writes during rapid mutations (default 1000ms)
  throttleTime: 2000,
});

/**
 * Max persisted cache age — entries older than this are discarded on restore.
 * Aligns with gcTime (24h) in query-client.ts. Prevents AsyncStorage from
 * exceeding iOS ~5-6MB limit on devices with heavy usage.
 */
export const PERSISTER_MAX_AGE = 24 * 60 * 60_000; // 24 hours

// Clean up stale cache keys from previous app versions
AsyncStorage.getAllKeys().then((keys) => {
  const staleKeys = keys.filter((k) => k.startsWith(QUERY_CACHE_KEY) && k !== CACHE_KEY);
  if (staleKeys.length > 0) {
    AsyncStorage.multiRemove(staleKeys);
  }
});
