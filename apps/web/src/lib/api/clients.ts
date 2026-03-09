import { createClientQueries } from '@epde/shared';

import { apiClient } from '../api-client';

export type { ClientFilters, ClientPublic } from '@epde/shared';

const queries = createClientQueries(apiClient);
export const { getClients, getClient, createClient, updateClient, deleteClient } = queries;
