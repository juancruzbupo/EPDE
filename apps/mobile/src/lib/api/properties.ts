import { createPropertyQueries } from '@epde/shared/api';
import { apiClient } from '../api-client';

export type { PropertyFilters } from '@epde/shared/api';

const queries = createPropertyQueries(apiClient);
export const { getProperties, getProperty } = queries;
