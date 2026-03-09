import { createServiceRequestQueries } from '@epde/shared';

import { apiClient } from '../api-client';

export type { ServiceRequestFilters } from '@epde/shared';

const queries = createServiceRequestQueries(apiClient);
export const { getServiceRequests, getServiceRequest, createServiceRequest } = queries;
