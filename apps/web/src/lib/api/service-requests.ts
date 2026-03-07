import { createServiceRequestQueries } from '@epde/shared';
import type { ServiceStatus } from '@epde/shared';
import { apiClient } from '../api-client';

export type { ServiceRequestFilters, ServiceRequestPublic } from '@epde/shared';

const queries = createServiceRequestQueries(apiClient);
export const { getServiceRequests, getServiceRequest, createServiceRequest } = queries;

// Admin-only
export async function updateServiceStatus(id: string, status: ServiceStatus) {
  const { data } = await apiClient.patch(`/service-requests/${id}/status`, { status });
  return data;
}
