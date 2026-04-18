import type { ProfessionalSpecialty, ServiceStatus, ServiceUrgency } from '../enums';
import type { BaseEntity, SoftDeletable } from '../index';
import type { PropertyBriefWithOwner, Serialized, UserBriefWithEmail } from './common';

export interface ServiceRequest extends BaseEntity, SoftDeletable {
  propertyId: string;
  requestedBy: string;
  taskId: string | null;
  title: string;
  description: string;
  urgency: ServiceUrgency;
  status: ServiceStatus;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface ServiceRequestTaskBrief {
  id: string;
  name: string;
  category: { id: string; name: string; icon: string | null };
}

export interface ServiceRequestPhoto {
  id: string;
  serviceRequestId: string;
  url: string;
  createdAt: Date;
}

export type ServiceRequestPhotoPublic = Serialized<Omit<ServiceRequestPhoto, 'serviceRequestId'>>;

export interface ServiceRequestAssignmentBrief {
  professionalId: string;
  professionalName: string;
  professionalSpecialty: ProfessionalSpecialty | null;
  assignedAt: string;
}

export type ServiceRequestPublic = Serialized<ServiceRequest> & {
  property: PropertyBriefWithOwner;
  requester: UserBriefWithEmail;
  task: ServiceRequestTaskBrief | null;
  photos: ServiceRequestPhotoPublic[];
  attachments: ServiceRequestAttachmentPublic[];
  assignment?: ServiceRequestAssignmentBrief | null;
};

export interface ServiceRequestAuditLogPublic {
  id: string;
  serviceRequestId: string;
  userId: string;
  action: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  changedAt: string;
  user: { id: string; name: string };
}

export interface ServiceRequestCommentPublic {
  id: string;
  serviceRequestId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
}

export interface ServiceRequestAttachmentPublic {
  id: string;
  serviceRequestId: string;
  url: string;
  fileName: string;
  createdAt: string;
}
