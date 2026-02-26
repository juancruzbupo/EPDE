export interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  order: number;
}

export type CategoryPublic = Category;
