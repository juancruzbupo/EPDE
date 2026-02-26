import type { BaseEntity, SoftDeletable } from './index';
import type {
  UserRole,
  UserStatus,
  PropertyType,
  PlanStatus,
  TaskPriority,
  RecurrenceType,
  TaskStatus,
  BudgetStatus,
  ServiceUrgency,
  ServiceStatus,
  NotificationType,
} from './enums';

// ─── User ───────────────────────────────────────────────

export interface User extends BaseEntity, SoftDeletable {
  email: string;
  passwordHash: string | null;
  name: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
}

export type UserPublic = Omit<User, 'passwordHash'>;

// ─── Property ───────────────────────────────────────────

export interface Property extends BaseEntity, SoftDeletable {
  userId: string;
  address: string;
  city: string;
  type: PropertyType;
  yearBuilt: number | null;
  squareMeters: number | null;
  photoUrl: string | null;
}

// ─── Maintenance Plan ───────────────────────────────────

export interface MaintenancePlan extends BaseEntity {
  propertyId: string;
  name: string;
  status: PlanStatus;
}

// ─── Category ───────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  order: number;
}

// ─── Task ───────────────────────────────────────────────

export interface Task extends BaseEntity, SoftDeletable {
  maintenancePlanId: string;
  categoryId: string;
  name: string;
  description: string | null;
  priority: TaskPriority;
  recurrenceType: RecurrenceType;
  recurrenceMonths: number | null;
  nextDueDate: Date;
  order: number;
  status: TaskStatus;
}

// ─── Task Log ───────────────────────────────────────────

export interface TaskLog {
  id: string;
  taskId: string;
  completedAt: Date;
  completedBy: string;
  notes: string | null;
  photoUrl: string | null;
}

// ─── Task Note ──────────────────────────────────────────

export interface TaskNote {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

export type TaskLogPublic = Serialized<Omit<TaskLog, 'completedBy'>> & {
  user: { id: string; name: string };
};

export type TaskNotePublic = Serialized<Omit<TaskNote, 'authorId'>> & {
  author: { id: string; name: string };
};

// ─── Budget Request ─────────────────────────────────────

export interface BudgetRequest extends BaseEntity {
  propertyId: string;
  requestedBy: string;
  title: string;
  description: string | null;
  status: BudgetStatus;
  updatedBy: string | null;
}

// ─── Budget Line Item ───────────────────────────────────

export interface BudgetLineItem {
  id: string;
  budgetRequestId: string;
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  subtotal: string | number;
}

// ─── Budget Response ────────────────────────────────────

export interface BudgetResponse {
  id: string;
  budgetRequestId: string;
  totalAmount: string | number;
  estimatedDays: number | null;
  notes: string | null;
  validUntil: Date | null;
  respondedAt: Date;
}

// ─── Service Request ────────────────────────────────────

export interface ServiceRequest extends BaseEntity {
  propertyId: string;
  requestedBy: string;
  title: string;
  description: string;
  urgency: ServiceUrgency;
  status: ServiceStatus;
  updatedBy: string | null;
}

// ─── Service Request Photo ──────────────────────────────

export interface ServiceRequestPhoto {
  id: string;
  serviceRequestId: string;
  url: string;
  createdAt: Date;
}

// ─── Notification ───────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data: Record<string, unknown> | null;
  createdAt: Date;
}

// ─── Utility Type: Serialized<T> ────────────────────────
// Converts Date → string for JSON-serialized API responses

type SerializedValue<T> = T extends Date
  ? string
  : T extends Array<infer U>
    ? Array<SerializedValue<U>>
    : T extends object
      ? Serialized<T>
      : T;

export type Serialized<T> = {
  [K in keyof T]: SerializedValue<T[K]>;
};

// ─── Common Nested Relation Shapes ──────────────────────

interface UserBrief {
  id: string;
  name: string;
}

interface UserBriefWithEmail extends UserBrief {
  email: string;
}

interface PropertyBrief {
  id: string;
  address: string;
  city: string;
}

interface PropertyBriefWithOwner extends PropertyBrief {
  user: UserBrief;
}

// ─── API Response Types (Serialized + Relations) ────────

export type ClientPublic = Serialized<Omit<User, 'passwordHash' | 'deletedAt'>>;

export type PropertyPublic = Serialized<Omit<Property, 'deletedAt'>> & {
  user?: UserBriefWithEmail;
  maintenancePlan?: { id: string; name: string; status: string } | null;
};

export type CategoryPublic = Category;

export type NotificationPublic = Serialized<Notification>;

export type BudgetLineItemPublic = Omit<BudgetLineItem, 'budgetRequestId'>;

export type BudgetResponsePublic = Serialized<Omit<BudgetResponse, 'budgetRequestId'>>;

export type BudgetRequestPublic = Serialized<BudgetRequest> & {
  property: PropertyBriefWithOwner;
  requester: UserBriefWithEmail;
  lineItems: BudgetLineItemPublic[];
  response: BudgetResponsePublic | null;
};

export type ServiceRequestPhotoPublic = Serialized<Omit<ServiceRequestPhoto, 'serviceRequestId'>>;

export type ServiceRequestPublic = Serialized<ServiceRequest> & {
  property: PropertyBriefWithOwner;
  requester: UserBriefWithEmail;
  photos: ServiceRequestPhotoPublic[];
};

export type TaskPublic = Serialized<Omit<Task, 'categoryId' | 'deletedAt'>> & {
  category: { id: string; name: string; icon: string | null };
};

export type TaskDetailPublic = TaskPublic & {
  taskLogs: TaskLogPublic[];
  taskNotes: TaskNotePublic[];
};

export type PlanPublic = Serialized<MaintenancePlan> & {
  tasks: TaskPublic[];
  property?: PropertyBrief & {
    user?: UserBriefWithEmail;
  };
};
