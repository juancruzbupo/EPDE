import type { PlanStatus, PropertySector, PropertyType } from '../enums';
import type { BaseEntity, SoftDeletable } from '../index';
import type { Serialized, UserBriefWithEmail } from './common';

export interface Property extends BaseEntity, SoftDeletable {
  userId: string;
  createdBy: string | null;
  updatedBy: string | null;
  address: string;
  city: string;
  type: PropertyType;
  activeSectors: PropertySector[];
  yearBuilt: number | null;
  squareMeters: number | null;
  photoUrl: string | null;
  lastContactedAt: string | null;
}

export type PropertyPublic = Serialized<Omit<Property, 'deletedAt'>> & {
  user?: UserBriefWithEmail;
  maintenancePlan?: { id: string; name: string; status: PlanStatus; createdAt: string } | null;
  latestISV?: { score: number; label: string } | null;
};
