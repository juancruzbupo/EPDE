import { createServiceRequestQueries } from '@epde/shared/api';
import { apiClient } from '../api-client';

export type { ServiceRequestFilters } from '@epde/shared/api';

const queries = createServiceRequestQueries(apiClient);
export const { getServiceRequests, getServiceRequest, createServiceRequest } = queries;
