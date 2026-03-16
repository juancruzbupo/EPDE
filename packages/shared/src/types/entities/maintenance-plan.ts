import type {
  PlanStatus,
  PropertySector,
  RecurrenceType,
  TaskPriority,
  TaskStatus,
} from '../enums';
import type { BaseEntity } from '../index';
import type { PropertyBrief, Serialized, UserBriefWithEmail } from './common';
import type { TaskPublic } from './task';

export interface MaintenancePlan extends BaseEntity {
  propertyId: string;
  name: string;
  status: PlanStatus;
  createdBy: string | null;
  updatedBy: string | null;
}

export type PlanPublic = Serialized<MaintenancePlan> & {
  tasks: TaskPublic[];
  property?: PropertyBrief & {
    user?: UserBriefWithEmail;
  };
};

/** Lightweight plan shape returned by list endpoints. */
export interface PlanListItem {
  id: string;
  name: string;
  status: PlanStatus;
  createdAt: string;
  property: { id: string; address: string; city: string; userId: string };
  _count: { tasks: number };
}

/** Lightweight task shape returned by list endpoints. */
export interface TaskListItem {
  id: string;
  name: string;
  status: TaskStatus;
  priority: TaskPriority;
  sector: PropertySector | null;
  nextDueDate: string | null;
  recurrenceType: RecurrenceType;
  category: { id: string; name: string; icon: string | null };
  maintenancePlan: {
    id: string;
    name: string;
    property: { id: string; address: string; city: string };
  };
}
