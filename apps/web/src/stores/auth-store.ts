import type { BaseAuthState } from '@epde/shared';
import { create } from 'zustand';

import * as authApi from '@/lib/auth';
import { queryClient } from '@/lib/query-client';

/** Web auth state — extends BaseAuthState (@epde/shared) with no extra fields. */
type AuthState = BaseAuthState;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  /** Web login: authApi.login returns `{ user, message }` — destructures `.user`.
   * (Mobile's authApi.login returns `UserPublic` directly because token storage is internal.) */
  login: async (email, password) => {
    const result = await authApi.login(email, password);
    set({ user: result.user, isAuthenticated: true });
  },

  logout: async () => {
    // Immediately clear local state to prevent in-flight requests with stale auth.
    // Web does not persist query cache (unlike mobile with AsyncStorage),
    // so queryClient.clear() is sufficient — no storage cleanup needed.
    queryClient.cancelQueries();
    queryClient.clear();
    set({ user: null, isAuthenticated: false });

    try {
      await authApi.logout();
    } catch {
      // API may fail — local cleanup already done
    }

    // Hard redirect to clear any stale client state and let the middleware
    // enforce the unauthenticated flow. Using window.location instead of
    // router.push to ensure a full page reload (no cached RSC payloads).
    window.location.href = '/login';
  },

  checkAuth: async () => {
    try {
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
