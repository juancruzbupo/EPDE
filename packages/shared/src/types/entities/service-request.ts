import type { BaseEntity } from '../index';
import type { ServiceUrgency, ServiceStatus } from '../enums';
import type { Serialized, PropertyBriefWithOwner, UserBriefWithEmail } from './common';

export interface ServiceRequest extends BaseEntity {
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
