import type { UserPublic } from '@epde/shared/types';

vi.mock('@/lib/auth', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
}));

vi.mock('@/lib/query-client', () => ({
  queryClient: {
    cancelQueries: vi.fn(),
    clear: vi.fn(),
  },
}));

import * as authApi from '@/lib/auth';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth-store';

const mockUser: UserPublic = {
  id: 'user-1',
  email: 'admin@epde.com',
  name: 'Admin EPDE',
  phone: null,
  role: 'ADMIN',
  status: 'ACTIVE',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  deletedAt: null,
};

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: true });
  });

  it('has correct initial state', () => {
    const state = useAuthStore.getState();

    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(true);
  });

  it('login() sets user and isAuthenticated on success', async () => {
    vi.mocked(authApi.login).mockResolvedValueOnce({ user: mockUser });

    await useAuthStore.getState().login('admin@epde.com', 'Password1');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(authApi.login).toHaveBeenCalledWith('admin@epde.com', 'Password1');
  });

  it('login() throws on API failure and does not set state', async () => {
    vi.mocked(authApi.login).mockRejectedValueOnce(new Error('Unauthorized'));

    await expect(useAuthStore.getState().login('bad@epde.com', 'wrong')).rejects.toThrow(
      'Unauthorized',
    );

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('logout() clears state and query cache even if API fails', async () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true });
    vi.mocked(authApi.logout).mockRejectedValueOnce(new Error('Network error'));

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(queryClient.cancelQueries).toHaveBeenCalled();
    expect(queryClient.clear).toHaveBeenCalled();
  });

  it('checkAuth() sets user on success', async () => {
    vi.mocked(authApi.getMe).mockResolvedValueOnce(mockUser);

    await useAuthStore.getState().checkAuth();

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('checkAuth() clears state on failure', async () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true, isLoading: true });
    vi.mocked(authApi.getMe).mockRejectedValueOnce(new Error('Unauthorized'));

    await useAuthStore.getState().checkAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });
});
