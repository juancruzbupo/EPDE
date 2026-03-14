import type { UserPublic } from '@epde/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import * as authApi from '@/lib/auth';
import { queryClient } from '@/lib/query-client';
import { tokenService } from '@/lib/token-service';

interface AuthState {
  user: UserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  /** Mobile login: authApi.login returns `UserPublic` directly (tokens stored via SecureStore).
   * (Web's authApi.login returns `{ user, message }` because tokens go in HTTP-only cookies.) */
  login: async (email, password) => {
    const user = await authApi.login(email, password);
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    // Immediately clear local state to prevent in-flight requests
    queryClient.cancelQueries();
    queryClient.clear();
    set({ user: null, isAuthenticated: false });

    try {
      await authApi.logout();
    } catch {
      // API may fail — local cleanup already done
    } finally {
      try {
        await tokenService.clearTokens();
      } catch {
        // SecureStore unavailable — tokens may persist until next app launch
      }

      // Clear persisted query cache to prevent data leaks between sessions
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith('epde-query-cache'));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    }
  },

  checkAuth: async () => {
    try {
      let hasTokens = false;
      try {
        hasTokens = await tokenService.hasTokens();
      } catch {
        // SecureStore unavailable (locked keychain, restricted device)
        // Treat as unauthenticated — user can re-login
      }
      if (!hasTokens) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      try {
        await tokenService.clearTokens();
      } catch {
        // SecureStore unavailable during cleanup — ignore
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
