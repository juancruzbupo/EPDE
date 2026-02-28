import { create } from 'zustand';
import type { UserPublic } from '@epde/shared/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '@/lib/auth';
import { tokenService } from '@/lib/token-service';
import { queryClient } from '@/lib/query-client';

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
      await tokenService.clearTokens();

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
      const hasTokens = await tokenService.hasTokens();
      if (!hasTokens) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      await tokenService.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
