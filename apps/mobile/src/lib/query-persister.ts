import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import Constants from 'expo-constants';

import { QUERY_CACHE_KEY } from './constants';
import { Sentry } from './sentry';

const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

/**
 * Monotonic schema version independent of APP_VERSION. Bump this ANY time a
 * persisted query's response shape changes in a backwards-incompatible way
 * (e.g., renamed field, dropped nullable, changed enum values). On next app
 * launch every cached query lands under a new key and the cleanup below
 * discards the old ones — no manual AsyncStorage.clear() needed, and no
 * need to wait for an app version bump for cache changes to take effect.
 *
 * Why not rely on APP_VERSION alone:
 *   - We ship schema changes mid-version via OTA updates.
 *   - A shape change without an APP_VERSION bump would surface stale rows
 *     as silently wrong UI until the user updates the app.
 *
 * The fingerprint test at `apps/mobile/src/lib/__tests__/cache-schema.test.ts`
 * locks this value and the PERSISTED_DOMAINS list. Any change to either —
 * including the "I added a new domain to persistence" or "I bumped the
 * version" cases — requires updating the test's expected values in the
 * same commit, making the decision visible in review.
 */
export const CACHE_SCHEMA_VERSION = 1;

/**
 * Domain query keys that MUST NOT be persisted to AsyncStorage (contain PII
 * or change with high frequency). Used by the `shouldDehydrateQuery`
 * callback in `_layout.tsx`; the inverse — domains this list doesn't
 * mention — IS persisted and therefore subject to `CACHE_SCHEMA_VERSION`.
 *
 * Adding a domain to this list → NO action on schema version.
 * Removing a domain (i.e., starting to persist it) → bump CACHE_SCHEMA_VERSION
 * so any stale value from previous installs gets invalidated.
 */
export const SENSITIVE_PERSIST_DENY = [
  'properties',
  'budgets',
  'serviceRequests',
  'inspections',
  'tasks',
  'maintenancePlans',
  'plans',
  'clients',
] as const;

const CACHE_KEY = `${QUERY_CACHE_KEY}-v${APP_VERSION}-s${CACHE_SCHEMA_VERSION}`;

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
