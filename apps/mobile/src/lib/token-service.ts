import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'epde_access_token';
const REFRESH_TOKEN_KEY = 'epde_refresh_token';

// expo-secure-store only works on iOS/Android; use localStorage on web for dev
const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const tokenService = {
  async getAccessToken(): Promise<string | null> {
    return storage.get(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return storage.get(REFRESH_TOKEN_KEY);
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      storage.set(ACCESS_TOKEN_KEY, accessToken),
      storage.set(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([storage.remove(ACCESS_TOKEN_KEY), storage.remove(REFRESH_TOKEN_KEY)]);
  },

  async hasTokens(): Promise<boolean> {
    const token = await storage.get(ACCESS_TOKEN_KEY);
    return token !== null;
  },
};
