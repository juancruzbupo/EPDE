import type { UserRole, UserStatus } from '../enums';
import type { BaseEntity, SoftDeletable } from '../index';
import type { Serialized } from './common';

export interface User extends BaseEntity, SoftDeletable {
  email: string;
  passwordHash: string | null;
  name: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  activatedAt: Date | null;
  subscriptionExpiresAt: Date | null;
}

export type UserPublic = Serialized<Omit<User, 'passwordHash'>>;

/** Client-facing user type — omits `deletedAt` since clients should never see soft-delete metadata */
export type ClientPublic = Serialized<Omit<User, 'passwordHash' | 'deletedAt'>>;
