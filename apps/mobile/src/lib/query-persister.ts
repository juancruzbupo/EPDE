import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import Constants from 'expo-constants';

import { QUERY_CACHE_KEY } from './constants';

const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';
const CACHE_KEY = `${QUERY_CACHE_KEY}-v${APP_VERSION}`;

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: CACHE_KEY,
});

// Clean up stale cache keys from previous app versions
AsyncStorage.getAllKeys().then((keys) => {
  const staleKeys = keys.filter((k) => k.startsWith(QUERY_CACHE_KEY) && k !== CACHE_KEY);
  if (staleKeys.length > 0) {
    AsyncStorage.multiRemove(staleKeys);
  }
});
