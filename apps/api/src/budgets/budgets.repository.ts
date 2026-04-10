import { BudgetStatus } from '@epde/shared';
import { Injectable } from '@nestjs/common';
import { BudgetRequest, Prisma } from '@prisma/client';

import {
  BudgetNotEditableError,
  BudgetNotQuotableError,
  BudgetVersionConflictError,
} from '../common/exceptions/domain.exceptions';
import {
  BaseRepository,
  FindManyParams,
  PaginatedResult,
} from '../common/repositories/base.repository';
import { PrismaService } from '../prisma/prisma.service';

const BUDGET_LIST_INCLUDE = {
  property: {
    select: {
      id: true,
      address: true,
      city: true,
      userId: true,
      user: { select: { id: true, name: true } },
    },
  },
  requester: { select: { id: true, name: true, email: true } },
};

const BUDGET_DETAIL_INCLUDE = {
  ...BUDGET_LIST_INCLUDE,
  lineItems: true,
  response: true,
  attachments: true,
};

@Injectable()
export class BudgetsRepository extends BaseRepository<BudgetRequest, 'budgetRequest'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'budgetRequest', true);
  }

  async findBudgets(params: {
    cursor?: string;
    take?: number;
    status?: BudgetStatus;
    propertyId?: string;
    search?: string;
    userId?: string;
  }): Promise<PaginatedResult<BudgetRequest>> {
    const where: Prisma.BudgetRequestWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.propertyId) {
      where.propertyId = params.propertyId;
    }

    if (params.userId) {
      where.requestedBy = params.userId;
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { property: { address: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const findParams: FindManyParams = {
      cursor: params.cursor,
      take: params.take,
      where,
      include: BUDGET_LIST_INCLUDE,
      count: false,
    };

    return this.findMany(findParams);
  }

  async findByIdWithDetails(id: string): Promise<BudgetRequest | null> {
    return this.findById(id, BUDGET_DETAIL_INCLUDE);
  }

  /**
   * Responds to (or re-quotes) a budget request within a transaction.
   *
   * Domain exceptions (BudgetNotQuotableError, BudgetVersionConflictError) are
   * thrown inside the transaction intentionally — TOCTOU safety requires the
   * status/version check to be atomic with the write operations. The service
   * layer performs a fast-fail pre-check, but the authoritative validation
   * lives here to prevent race conditions.
   *
   * Note: `findUnique` inside `$transaction` intentionally omits `deletedAt: null` —
   * the TOCTOU re-check needs to see the record even if concurrently soft-deleted,
   * and the status/version guard will reject it gracefully.
   *
   * When re-quoting (status is QUOTED), existing line items and response are
   * deleted before creating the new ones.
   */
  async respondToBudget(
    id: string,
    expectedVersion: number,
    lineItems: { description: string; quantity: number; unitPrice: number }[],
    response: {
      totalAmount: number;
      estimatedDays?: number;
      notes?: string;
      validUntil?: Date | null;
      updatedBy?: string;
    },
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        // Re-check status + version inside transaction for TOCTOU safety
        const budget = await tx.budgetRequest.findUnique({ where: { id } });
        if (
          !budget ||
          (budget.status !== BudgetStatus.PENDING && budget.status !== BudgetStatus.QUOTED)
        ) {
          throw new BudgetNotQuotableError();
        }
        if (budget.version !== expectedVersion) {
          throw new BudgetVersionConflictError();
        }

        // Re-quoting: delete existing line items + response before creating new ones
        if (budget.status === BudgetStatus.QUOTED) {
          await tx.budgetLineItem.deleteMany({ where: { budgetRequestId: id } });
          await tx.budgetResponse.deleteMany({ where: { budgetRequestId: id } });
        }

        await tx.budgetLineItem.createMany({
          data: lineItems.map((item) => ({
            budgetRequestId: id,
            description: item.description,
            quantity: new Prisma.Decimal(item.quantity),
            unitPrice: new Prisma.Decimal(item.unitPrice),
            subtotal: new Prisma.Decimal(item.quantity).mul(new Prisma.Decimal(item.unitPrice)),
          })),
        });

        await tx.budgetResponse.create({
          data: {
            budgetRequestId: id,
            totalAmount: response.totalAmount,
            estimatedDays: response.estimatedDays,
            notes: response.notes,
            validUntil: response.validUntil,
          },
        });

        return tx.budgetRequest.update({
          where: { id },
          data: {
            status: BudgetStatus.QUOTED,
            updatedBy: response.updatedBy,
            version: { increment: 1 },
          },
          include: BUDGET_DETAIL_INCLUDE,
        });
      },
      { timeout: 10_000 },
    );
  }

  /**
   * Edits a budget request within a transaction (PENDING only, TOCTOU-safe).
   * Note: findUnique inside $transaction intentionally omits `deletedAt: null` —
   * the TOCTOU check needs to see the record even if concurrently soft-deleted,
   * and the subsequent status/version check will reject it gracefully.
   */
  async editBudgetRequest(
    id: string,
    expectedVersion: number,
    data: { title?: string; description?: string | null },
    updatedBy: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const budget = await tx.budgetRequest.findUnique({ where: { id } });
        if (!budget || budget.status !== BudgetStatus.PENDING) {
          throw new BudgetNotEditableError();
        }
        if (budget.version !== expectedVersion) {
          throw new BudgetVersionConflictError();
        }

        return tx.budgetRequest.update({
          where: { id },
          data: { ...data, updatedBy, version: { increment: 1 } },
          include: BUDGET_DETAIL_INCLUDE,
        });
      },
      { timeout: 10_000 },
    );
  }

  /**
   * Finds QUOTED budgets whose validUntil date has passed.
   * Used by the budget expiration scheduler.
   */
  async findExpiredQuotedBudgets() {
    const now = new Date();
    return this.prisma.budgetRequest.findMany({
      where: {
        status: BudgetStatus.QUOTED,
        deletedAt: null,
        response: { validUntil: { lt: now } },
      },
      include: {
        response: true,
        requester: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Atomic status update with optimistic locking (TOCTOU-safe).
   * Re-checks status + version inside transaction before updating.
   *
   * `findUnique` omits `deletedAt: null` intentionally — same TOCTOU pattern
   * as respondToBudget: the status guard rejects deleted records gracefully.
   */
  async updateStatusAtomic(
    id: string,
    newStatus: BudgetStatus,
    expectedVersion: number,
    updatedBy: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const budget = await tx.budgetRequest.findUnique({ where: { id } });
        if (!budget) return null;
        if (budget.version !== expectedVersion) {
          throw new BudgetVersionConflictError();
        }

        return tx.budgetRequest.update({
          where: { id },
          data: { status: newStatus, updatedBy, version: { increment: 1 } },
          include: BUDGET_DETAIL_INCLUDE,
        });
      },
      { timeout: 10_000 },
    );
  }

  /**
   * Batch-expire budgets (scheduler use). Increments version for consistency.
   */
  async expireBudgets(ids: string[]) {
    if (ids.length === 0) return 0;
    const result = await this.prisma.budgetRequest.updateMany({
      where: { id: { in: ids }, status: BudgetStatus.QUOTED },
      data: { status: BudgetStatus.EXPIRED, version: { increment: 1 } },
    });
    return result.count;
  }
}
