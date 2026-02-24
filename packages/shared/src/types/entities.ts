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

// ─── Budget Request ─────────────────────────────────────

export interface BudgetRequest extends BaseEntity {
  propertyId: string;
  requestedBy: string;
  title: string;
  description: string | null;
  status: BudgetStatus;
}

// ─── Budget Line Item ───────────────────────────────────

export interface BudgetLineItem {
  id: string;
  budgetRequestId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// ─── Budget Response ────────────────────────────────────

export interface BudgetResponse {
  id: string;
  budgetRequestId: string;
  totalAmount: number;
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
