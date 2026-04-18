import { createTechnicalInspectionQueries } from '@epde/shared';

import { apiClient } from '../api-client';

const queries = createTechnicalInspectionQueries(apiClient);

export const {
  getTechnicalInspections,
  getTechnicalInspection,
  createTechnicalInspection,
  scheduleTechnicalInspection,
  updateTechnicalInspectionStatus,
  uploadTechnicalInspectionDeliverable,
  markTechnicalInspectionPaid,
  cancelTechnicalInspection,
} = queries;
