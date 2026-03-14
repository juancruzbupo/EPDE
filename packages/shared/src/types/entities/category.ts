import type { SoftDeletable } from '../index';

export interface Category extends SoftDeletable {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  order: number;
  categoryTemplateId: string | null;
}

export type CategoryPublic = Omit<Category, 'deletedAt'>;
