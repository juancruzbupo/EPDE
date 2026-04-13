import type { UserPublic } from './entities';
import type { UserRole } from './enums';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SetPasswordRequest {
  token: string;
  newPassword: string;
}

/** Web only — tokens handled via HttpOnly cookies, not included in response body. */
export interface AuthResponse {
  user: UserPublic;
}

export interface MobileAuthResponse {
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
}

export interface MobileRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  jti: string;
  family?: string;
  /** ISO string of subscription expiration (CLIENT only). */
  subExp?: string;
  iat?: number;
  exp?: number;
}

/**
 * Common auth store contract shared by web and mobile Zustand stores.
 *
 * Each app extends this with platform-specific fields (e.g. mobile adds
 * `subscriptionExpired`) and platform-specific implementations of each method.
 *
 * This type is the SSoT for fields that MUST exist on both stores.
 * If you rename or remove a field here, update both `apps/web/src/stores/auth-store.ts`
 * and `apps/mobile/src/stores/auth-store.ts`.
 */
export interface BaseAuthState {
  user: UserPublic | null;
  isAuthenticated: boolean;
  /** True while the initial auth check (checkAuth) is in progress. */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Validates an existing session on app startup. Must set isLoading=false when done. */
  checkAuth: () => Promise<void>;
}

/** Shape returned by JwtStrategy.validate() — set on req.user for all authenticated requests. */
export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  jti: string;
  family?: string;
  exp?: number;
  /** ISO string — null for admins and pre-subscription users. */
  subscriptionExpiresAt: string | null;
}

/** Minimal user context needed by domain services (id + role). */
export type ServiceUser = Pick<CurrentUser, 'id' | 'role'>;
