import type { BaseEntity } from '../index';
import type { BudgetStatus } from '../enums';
import type { Serialized, PropertyBriefWithOwner, UserBriefWithEmail } from './common';

export interface BudgetRequest extends BaseEntity {
  propertyId: string;
  requestedBy: string;
  title: string;
  description: string | null;
  status: BudgetStatus;
  updatedBy: string | null;
}

export interface BudgetLineItem {
  id: string;
  budgetRequestId: string;
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  subtotal: string | number;
}

export interface BudgetResponse {
  id: string;
  budgetRequestId: string;
  totalAmount: string | number;
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
};
