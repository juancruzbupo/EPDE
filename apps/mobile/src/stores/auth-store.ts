import { create } from 'zustand';
import type { UserPublic } from '@epde/shared/types';
import * as authApi from '@/lib/auth';
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

  login: async (email, password) => {
    const user = await authApi.login(email, password);
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // authApi.logout already handles errors, but be defensive
      await tokenService.clearTokens();
    } finally {
      set({ user: null, isAuthenticated: false });
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
