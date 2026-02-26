import type { BaseEntity, SoftDeletable } from '../index';
import type { UserRole, UserStatus } from '../enums';
import type { Serialized } from './common';

export interface User extends BaseEntity, SoftDeletable {
  email: string;
  passwordHash: string | null;
  name: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
}

export type UserPublic = Omit<User, 'passwordHash'>;

export type ClientPublic = Serialized<Omit<User, 'passwordHash' | 'deletedAt'>>;
