import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import Constants from 'expo-constants';

import { QUERY_CACHE_KEY } from './constants';
import { Sentry } from './sentry';

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
 * Aligns with gcTime (6h) in query-client.ts. Prevents AsyncStorage from
 * exceeding iOS ~5-6MB limit on devices with heavy usage.
 */
export const PERSISTER_MAX_AGE = 6 * 60 * 60_000; // 6 hours

// Clean up stale cache keys from previous app versions
AsyncStorage.getAllKeys().then((keys) => {
  const staleKeys = keys.filter((k) => k.startsWith(QUERY_CACHE_KEY) && k !== CACHE_KEY);
  if (staleKeys.length > 0) {
    AsyncStorage.multiRemove(staleKeys);
  }
});

// Report cache size to Sentry every 5 minutes as a breadcrumb for debugging.
// When a user reports a crash, preceding breadcrumbs show if cache was growing abnormally.
setInterval(async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(QUERY_CACHE_KEY));
    if (cacheKeys.length === 0) return;
    const values = await AsyncStorage.multiGet(cacheKeys);
    const totalBytes = values.reduce((sum, [, v]) => sum + (v?.length ?? 0), 0);
    Sentry.addBreadcrumb({
      category: 'cache',
      message: `Query cache: ${cacheKeys.length} key(s), ${Math.round(totalBytes / 1024)}KB`,
      level: 'info',
      data: { keys: cacheKeys.length, bytes: totalBytes },
    });
  } catch {
    // Cache monitoring must never crash the app
  }
}, 5 * 60_000);
