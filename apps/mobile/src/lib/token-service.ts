import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'epde_access_token';
const REFRESH_TOKEN_KEY = 'epde_refresh_token';

const isWeb = Platform.OS === 'web';

/**
 * In-memory cache to avoid repeated SecureStore reads (50-200ms each).
 * SecureStore is the source of truth for persistence across app restarts;
 * the cache is populated on first read and kept in sync on write/clear.
 */
let cachedAccessToken: string | null = null;
let cachedRefreshToken: string | null = null;
let cacheLoaded = false;

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    return sessionStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    sessionStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    sessionStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

async function loadCache(): Promise<void> {
  if (cacheLoaded) return;
  cachedAccessToken = await getItem(ACCESS_TOKEN_KEY);
  cachedRefreshToken = await getItem(REFRESH_TOKEN_KEY);
  cacheLoaded = true;
}

export const tokenService = {
  async getAccessToken(): Promise<string | null> {
    await loadCache();
    return cachedAccessToken;
  },

  async getRefreshToken(): Promise<string | null> {
    await loadCache();
    return cachedRefreshToken;
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    cachedAccessToken = accessToken;
    cachedRefreshToken = refreshToken;
    cacheLoaded = true;
    await Promise.all([
      setItem(ACCESS_TOKEN_KEY, accessToken),
      setItem(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },

  async clearTokens(): Promise<void> {
    cachedAccessToken = null;
    cachedRefreshToken = null;
    cacheLoaded = true;
    await Promise.all([deleteItem(ACCESS_TOKEN_KEY), deleteItem(REFRESH_TOKEN_KEY)]);
  },

  async hasTokens(): Promise<boolean> {
    await loadCache();
    return cachedAccessToken !== null;
  },
};
