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
  iat?: number;
  exp?: number;
}

/** Shape returned by JwtStrategy.validate() — set on req.user for all authenticated requests. */
export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  jti: string;
  family?: string;
  exp?: number;
}

/** Minimal user context needed by domain services (id + role). */
export type ServiceUser = Pick<CurrentUser, 'id' | 'role'>;
