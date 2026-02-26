import { createServiceRequestQueries } from '@epde/shared/api';
import { apiClient } from '../api-client';

export type { ServiceRequestFilters } from '@epde/shared/api';
export type { ServiceRequestPublic } from '@epde/shared';

const queries = createServiceRequestQueries(apiClient);
export const { getServiceRequests, getServiceRequest, createServiceRequest } = queries;

// Admin-only
export async function updateServiceStatus(id: string, status: string) {
  const { data } = await apiClient.patch(`/service-requests/${id}/status`, { status });
  return data;
}
