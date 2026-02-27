import type { UserPublic } from '@epde/shared/types';
import { useAuthStore } from '@/stores/auth-store';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/auth');
jest.mock('@/lib/token-service');
jest.mock('@/lib/query-client');

import * as authApi from '@/lib/auth';
import { tokenService } from '@/lib/token-service';
import { queryClient } from '@/lib/query-client';

const mockedAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockedTokenService = tokenService as jest.Mocked<typeof tokenService>;
const mockedQueryClient = queryClient as jest.Mocked<typeof queryClient>;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockUser: UserPublic = {
  id: 'user-1',
  email: 'test@epde.com',
  name: 'Test User',
  phone: null,
  role: 'CLIENT',
  status: 'ACTIVE',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  deletedAt: null,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reset the Zustand store back to its initial state between tests. */
function resetStore() {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Auth Store (useAuthStore)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  // 1. Initial state
  it('has correct initial state: user null, isAuthenticated false, isLoading true', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(true);
  });

  // 2. login() success
  it('login() stores user and sets isAuthenticated to true', async () => {
    mockedAuthApi.login.mockResolvedValueOnce(mockUser);

    await useAuthStore.getState().login('test@epde.com', 'password123');

    const state = useAuthStore.getState();
    expect(mockedAuthApi.login).toHaveBeenCalledWith('test@epde.com', 'password123');
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  // 3. login() failure
  it('login() throws on failure without changing state', async () => {
    const error = new Error('Invalid credentials');
    mockedAuthApi.login.mockRejectedValueOnce(error);

    await expect(useAuthStore.getState().login('wrong@epde.com', 'badpass')).rejects.toThrow(
      'Invalid credentials',
    );

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  // 4. logout() success path
  it('logout() clears state, cancels queries, and clears tokens', async () => {
    // Pre-populate an authenticated state
    useAuthStore.setState({ user: mockUser, isAuthenticated: true, isLoading: false });

    mockedAuthApi.logout.mockResolvedValueOnce(undefined);
    mockedTokenService.clearTokens.mockResolvedValueOnce(undefined);

    await useAuthStore.getState().logout();

    expect(mockedQueryClient.cancelQueries).toHaveBeenCalled();
    expect(mockedQueryClient.clear).toHaveBeenCalled();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);

    expect(mockedAuthApi.logout).toHaveBeenCalled();
    expect(mockedTokenService.clearTokens).toHaveBeenCalled();
  });

  // 5. logout() still clears state if API call fails
  it('logout() still clears state and tokens even if API call fails', async () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true, isLoading: false });

    mockedAuthApi.logout.mockRejectedValueOnce(new Error('Network error'));
    mockedTokenService.clearTokens.mockResolvedValueOnce(undefined);

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(mockedTokenService.clearTokens).toHaveBeenCalled();
  });

  // 6. checkAuth() restores session when tokens exist
  it('checkAuth() restores session when tokens exist', async () => {
    mockedTokenService.hasTokens.mockResolvedValueOnce(true);
    mockedAuthApi.getMe.mockResolvedValueOnce(mockUser);

    await useAuthStore.getState().checkAuth();

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  // 7. checkAuth() sets unauthenticated when no tokens
  it('checkAuth() sets unauthenticated when no tokens exist', async () => {
    mockedTokenService.hasTokens.mockResolvedValueOnce(false);

    await useAuthStore.getState().checkAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(mockedAuthApi.getMe).not.toHaveBeenCalled();
  });

  // 8. checkAuth() clears tokens on getMe failure
  it('checkAuth() clears tokens and sets unauthenticated on getMe failure', async () => {
    mockedTokenService.hasTokens.mockResolvedValueOnce(true);
    mockedAuthApi.getMe.mockRejectedValueOnce(new Error('Token expired'));
    mockedTokenService.clearTokens.mockResolvedValueOnce(undefined);

    await useAuthStore.getState().checkAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(mockedTokenService.clearTokens).toHaveBeenCalled();
  });
});
