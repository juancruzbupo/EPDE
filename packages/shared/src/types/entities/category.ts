import type { BaseEntity, SoftDeletable } from '../index';

export interface Category extends BaseEntity, SoftDeletable {
  name: string;
  description: string | null;
  icon: string | null;
  order: number;
  categoryTemplateId: string | null;
}

export type CategoryPublic = Omit<Category, 'deletedAt'>;
