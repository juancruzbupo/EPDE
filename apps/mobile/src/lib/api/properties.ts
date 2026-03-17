import { createPropertyQueries } from '@epde/shared';

import { apiClient } from '../api-client';

export type { PropertyFilters } from '@epde/shared';

const queries = createPropertyQueries(apiClient);
export const {
  getProperties,
  getProperty,
  getPropertyExpenses,
  getPropertyPhotos,
  getPropertyHealthIndex,
  getPropertyHealthHistory,
} = queries;
