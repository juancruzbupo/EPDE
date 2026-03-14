/**
 * Mobile service-request API — client-only.
 * Admin mutations (updateServiceStatus) live exclusively in web's service-requests.ts.
 */
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
