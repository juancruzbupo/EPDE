import { createClientQueries } from '@epde/shared';
import { apiClient } from '../api-client';

export type { ClientPublic, ClientFilters } from '@epde/shared';

const queries = createClientQueries(apiClient);
export const { getClients, getClient, createClient, updateClient, deleteClient } = queries;
