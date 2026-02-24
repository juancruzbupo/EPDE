export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeletable {
  deletedAt: Date | null;
}
