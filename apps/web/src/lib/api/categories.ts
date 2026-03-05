import { createCategoryQueries } from '@epde/shared/api';
import { apiClient } from '../api-client';

export type { CategoryPublic } from '@epde/shared';

const queries = createCategoryQueries(apiClient);
export const { getCategories, createCategory, updateCategory, deleteCategory } = queries;
