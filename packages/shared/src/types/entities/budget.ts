import type { BudgetStatus } from '../enums';
import type { BaseEntity, SoftDeletable } from '../index';
import type { PropertyBriefWithOwner, Serialized, UserBriefWithEmail } from './common';

export interface BudgetRequest extends BaseEntity, SoftDeletable {
  propertyId: string;
  requestedBy: string;
  title: string;
  description: string | null;
  status: BudgetStatus;
  createdBy: string | null;
  updatedBy: string | null;
  version: number;
}

export interface BudgetLineItem {
  id: string;
  budgetRequestId: string;
  description: string;
  /** Prisma Decimal — serialized as string in JSON for precision */
  quantity: string;
  /** Prisma Decimal — serialized as string in JSON for precision */
  unitPrice: string;
  /** Prisma Decimal — serialized as string in JSON for precision */
  subtotal: string;
}

export interface BudgetResponse {
  id: string;
  budgetRequestId: string;
  totalAmount: string;
  estimatedDays: number | null;
  notes: string | null;
  validUntil: Date | null;
  respondedAt: Date;
}

export type BudgetLineItemPublic = Omit<BudgetLineItem, 'budgetRequestId'>;

export type BudgetResponsePublic = Serialized<Omit<BudgetResponse, 'budgetRequestId'>>;

export type BudgetRequestPublic = Serialized<BudgetRequest> & {
  property: PropertyBriefWithOwner;
  requester: UserBriefWithEmail;
  lineItems: BudgetLineItemPublic[];
  response: BudgetResponsePublic | null;
  attachments: BudgetAttachmentPublic[];
};

export interface BudgetAuditLogPublic {
  id: string;
  budgetId: string;
  userId: string;
  action: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  changedAt: string;
  user: { id: string; name: string };
}

export interface BudgetCommentPublic {
  id: string;
  budgetId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
}

export interface BudgetAttachmentPublic {
  id: string;
  budgetId: string;
  url: string;
  fileName: string;
  createdAt: string;
}
