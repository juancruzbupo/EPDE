import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';
const CACHE_KEY = `epde-query-cache-v${APP_VERSION}`;

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: CACHE_KEY,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
});

// Clean up stale cache keys from previous app versions
AsyncStorage.getAllKeys().then((keys) => {
  const staleKeys = keys.filter((k) => k.startsWith('epde-query-cache') && k !== CACHE_KEY);
  if (staleKeys.length > 0) {
    AsyncStorage.multiRemove(staleKeys);
  }
});
