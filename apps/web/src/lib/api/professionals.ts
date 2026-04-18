import { createProfessionalQueries } from '@epde/shared';

import { apiClient } from '../api-client';

const queries = createProfessionalQueries(apiClient);
export const {
  getProfessionals,
  getProfessional,
  getProfessionalPayments,
  getSuggestedProfessionals,
  createProfessional,
  updateProfessional,
  deleteProfessional,
  updateTier,
  updateAvailability,
  createRating,
  deleteRating,
  createTimelineNote,
  createTag,
  deleteTag,
  createAttachment,
  verifyAttachment,
  deleteAttachment,
  assignProfessional,
  unassignProfessional,
  createPayment,
  updatePaymentStatus,
} = queries;
