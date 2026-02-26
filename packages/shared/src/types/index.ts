export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeletable {
  deletedAt: Date | null;
}

export * from './enums';
export * from './entities/index';
export * from './auth';
export * from './api';
export * from './dashboard';
