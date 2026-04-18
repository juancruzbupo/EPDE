import type {
  ProfessionalAttachmentType,
  ProfessionalAvailability,
  ProfessionalPaymentStatus,
  ProfessionalSpecialty,
  ProfessionalTier,
} from '../enums';

/**
 * Professionals directory — admin-only internal tool. See ADR-018.
 *
 * Passive entity: professionals have no auth/login. Admin maintains the
 * catalog, assigns them to service requests, and records ratings + payments.
 */

export interface ProfessionalAttachmentPublic {
  id: string;
  type: ProfessionalAttachmentType;
  url: string;
  fileName: string;
  expiresAt: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  createdAt: string;
}

export interface ProfessionalRatingPublic {
  id: string;
  authorId: string;
  authorName: string | null;
  serviceRequestId: string | null;
  score: number;
  punctuality: number | null;
  quality: number | null;
  priceValue: number | null;
  adminComment: string | null;
  clientComment: string | null;
  createdAt: string;
}

export interface ProfessionalTimelineNotePublic {
  id: string;
  authorId: string;
  authorName: string | null;
  content: string;
  createdAt: string;
}

export interface ProfessionalSpecialtyAssignmentPublic {
  specialty: ProfessionalSpecialty;
  isPrimary: boolean;
}

/** Stats computed on the fly (not persisted). */
export interface ProfessionalStats {
  /** Bayesian-smoothed average (m=3.5 prior, C=5). Null if no ratings yet. */
  ratingAvg: number | null;
  ratingCount: number;
  completedAssignments: number;
  activeAssignments: number;
  totalPaid: number;
  pendingPayments: number;
  lastAssignedAt: string | null;
}

export interface ProfessionalPublic {
  id: string;
  name: string;
  email: string;
  phone: string;
  photoUrl: string | null;
  bio: string | null;
  registrationNumber: string;
  registrationBody: string;
  serviceAreas: string[];
  yearsOfExperience: number | null;
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  availability: ProfessionalAvailability;
  availableUntil: string | null;
  tier: ProfessionalTier;
  blockedReason: string | null;
  notes: string | null;
  specialties: ProfessionalSpecialtyAssignmentPublic[];
  tags: string[];
  stats: ProfessionalStats;
  createdAt: string;
  updatedAt: string;
}

/** Full detail shape returned by GET /professionals/:id */
export interface ProfessionalDetailPublic extends ProfessionalPublic {
  attachments: ProfessionalAttachmentPublic[];
  ratings: ProfessionalRatingPublic[];
  timelineNotes: ProfessionalTimelineNotePublic[];
}

export interface ProfessionalFilters {
  search?: string;
  specialty?: ProfessionalSpecialty;
  tier?: ProfessionalTier;
  availability?: ProfessionalAvailability;
  serviceArea?: string;
  cursor?: string;
  take?: number;
}

export interface ProfessionalPaymentPublic {
  id: string;
  professionalId: string;
  serviceRequestId: string | null;
  amount: number;
  status: ProfessionalPaymentStatus;
  paidAt: string | null;
  paymentMethod: string | null;
  receiptUrl: string | null;
  notes: string | null;
  createdAt: string;
}

export interface ServiceRequestAssignmentPublic {
  id: string;
  serviceRequestId: string;
  professionalId: string;
  professionalName: string;
  professionalSpecialty: ProfessionalSpecialty | null;
  assignedAt: string;
  assignedBy: string;
}

/** Suggested professionals for a given ServiceRequest (top 3). */
export interface ProfessionalSuggestion {
  professional: ProfessionalPublic;
  matchReason: string;
}
