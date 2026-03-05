import { createClientQueries } from '@epde/shared/api';
import { apiClient } from '../api-client';

export type { ClientPublic } from '@epde/shared';
export type { ClientFilters } from '@epde/shared/api';

const queries = createClientQueries(apiClient);
export const { getClients, getClient, createClient, updateClient, deleteClient } = queries;
