import { createCategoryTemplateQueries } from '@epde/shared';
import { apiClient } from '../api-client';

export type { CategoryTemplate } from '@epde/shared';

const queries = createCategoryTemplateQueries(apiClient);
export const {
  getCategoryTemplates,
  getCategoryTemplate,
  createCategoryTemplate,
  updateCategoryTemplate,
  deleteCategoryTemplate,
  createTaskTemplate,
  updateTaskTemplate,
  deleteTaskTemplate,
} = queries;
