import type { ServiceStatus, ServiceUrgency } from '../enums';
import type { BaseEntity, SoftDeletable } from '../index';
import type { PropertyBriefWithOwner, Serialized, UserBriefWithEmail } from './common';

export interface ServiceRequest extends BaseEntity, SoftDeletable {
  propertyId: string;
  requestedBy: string;
  title: string;
  description: string;
  urgency: ServiceUrgency;
  status: ServiceStatus;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface ServiceRequestPhoto {
  id: string;
  serviceRequestId: string;
  url: string;
  createdAt: Date;
}

export type ServiceRequestPhotoPublic = Serialized<Omit<ServiceRequestPhoto, 'serviceRequestId'>>;

export type ServiceRequestPublic = Serialized<ServiceRequest> & {
  property: PropertyBriefWithOwner;
  requester: UserBriefWithEmail;
  photos: ServiceRequestPhotoPublic[];
};
