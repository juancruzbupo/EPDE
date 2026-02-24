export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeletable {
  deletedAt: Date | null;
}

export * from './enums';
export * from './entities';
export * from './auth';
export * from './api';
