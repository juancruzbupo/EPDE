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
  accessToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface RefreshResponse {
  accessToken: string;
}
