import type { UserRole } from './enums';
import type { UserPublic } from './entities';

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
  iat?: number;
  exp?: number;
}
