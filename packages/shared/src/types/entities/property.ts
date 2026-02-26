import type { BaseEntity, SoftDeletable } from '../index';
import type { PropertyType } from '../enums';
import type { Serialized, UserBriefWithEmail } from './common';

export interface Property extends BaseEntity, SoftDeletable {
  userId: string;
  address: string;
  city: string;
  type: PropertyType;
  yearBuilt: number | null;
  squareMeters: number | null;
  photoUrl: string | null;
}

export type PropertyPublic = Serialized<Omit<Property, 'deletedAt'>> & {
  user?: UserBriefWithEmail;
  maintenancePlan?: { id: string; name: string; status: string } | null;
};
