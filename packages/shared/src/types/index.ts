export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeletable {
  deletedAt: Date | null;
}

export * from './api';
export * from './auth';
export * from './dashboard';
export * from './entities/index';
export * from './enums';
