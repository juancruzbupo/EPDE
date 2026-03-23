import type { ApiResponse, ServiceRequestPublic, ServiceStatus } from '@epde/shared';
import { createServiceRequestQueries } from '@epde/shared';

import { apiClient } from '../api-client';

export type { ServiceRequestFilters } from '@epde/shared';

const queries = createServiceRequestQueries(apiClient);
export const {
  getServiceRequests,
  getServiceRequest,
  createServiceRequest,
  editServiceRequest,
  getServiceRequestAuditLog,
  getServiceRequestComments,
  createServiceRequestComment,
  addServiceRequestAttachments,
} = queries;

// Admin-only
export async function updateServiceStatus(
  id: string,
  status: ServiceStatus,
  note?: string,
): Promise<ApiResponse<ServiceRequestPublic>> {
  const { data } = await apiClient.patch(`/service-requests/${id}/status`, { status, note });
  return data;
}
