import type { BaseEntity } from '../index';
import type { PlanStatus } from '../enums';
import type { Serialized, PropertyBrief, UserBriefWithEmail } from './common';
import type { TaskPublic } from './task';

export interface MaintenancePlan extends BaseEntity {
  propertyId: string;
  name: string;
  status: PlanStatus;
}

export type PlanPublic = Serialized<MaintenancePlan> & {
  tasks: TaskPublic[];
  property?: PropertyBrief & {
    user?: UserBriefWithEmail;
  };
};
