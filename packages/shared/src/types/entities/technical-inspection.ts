import type {
  InspectionPriceTier,
  TechnicalInspectionPaymentStatus,
  TechnicalInspectionStatus,
  TechnicalInspectionType,
} from '../enums';

/**
 * Technical Inspection — paid professional service.
 * See ADR-019 for model + pricing rationale.
 */

export interface TechnicalInspectionPublic {
  id: string;
  inspectionNumber: string;
  propertyId: string;
  property?: {
    id: string;
    address: string;
    city: string;
  };
  requestedBy: string;
  requester?: {
    id: string;
    name: string;
    email: string;
  };
  type: TechnicalInspectionType;
  status: TechnicalInspectionStatus;

  clientNotes: string | null;
  adminNotes: string | null;
  scheduledFor: string | null;
  completedAt: string | null;

  deliverableUrl: string | null;
  deliverableFileName: string | null;

  feeAmount: number;
  priceTier: InspectionPriceTier;
  propertySqm: number | null;
  feeStatus: TechnicalInspectionPaymentStatus;
  hadActivePlan: boolean;
  paidAt: string | null;
  paymentMethod: string | null;
  paymentReceiptUrl: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface TechnicalInspectionFilters {
  status?: TechnicalInspectionStatus;
  type?: TechnicalInspectionType;
  propertyId?: string;
  feeStatus?: TechnicalInspectionPaymentStatus;
  cursor?: string;
  take?: number;
}
