import { BudgetStatus } from '@epde/shared';
import { Injectable } from '@nestjs/common';
import { BudgetRequest, Prisma } from '@prisma/client';

import {
  BudgetNotPendingError,
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
};

@Injectable()
export class BudgetsRepository extends BaseRepository<BudgetRequest, 'budgetRequest'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'budgetRequest', true);
  }

  async findBudgets(params: {
    cursor?: string;
    take?: number;
    status?: string;
    propertyId?: string;
    userId?: string;
  }): Promise<PaginatedResult<BudgetRequest>> {
    const where: Prisma.BudgetRequestWhereInput = {};

    if (params.status) {
      where.status = params.status as Prisma.EnumBudgetStatusFilter;
    }

    if (params.propertyId) {
      where.propertyId = params.propertyId;
    }

    if (params.userId) {
      where.requestedBy = params.userId;
    }

    const findParams: FindManyParams = {
      cursor: params.cursor,
      take: params.take,
      where,
      include: BUDGET_LIST_INCLUDE,
    };

    return this.findMany(findParams);
  }

  async findByIdWithDetails(id: string): Promise<BudgetRequest | null> {
    return this.findById(id, BUDGET_DETAIL_INCLUDE);
  }

  /**
   * Responds to a budget request within a transaction.
   *
   * Domain exceptions (BudgetNotPendingError, BudgetVersionConflictError) are
   * thrown inside the transaction intentionally — TOCTOU safety requires the
   * status/version check to be atomic with the write operations. The service
   * layer performs a fast-fail pre-check, but the authoritative validation
   * lives here to prevent race conditions.
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
    return this.prisma.$transaction(async (tx) => {
      // Re-check status + version inside transaction for TOCTOU safety
      const budget = await tx.budgetRequest.findUnique({ where: { id } });
      if (!budget || budget.status !== BudgetStatus.PENDING) {
        throw new BudgetNotPendingError();
      }
      if (budget.version !== expectedVersion) {
        throw new BudgetVersionConflictError();
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
        data: { status: 'QUOTED', updatedBy: response.updatedBy, version: { increment: 1 } },
        include: {
          property: {
            select: {
              id: true,
              address: true,
              city: true,
              user: { select: { id: true, name: true } },
            },
          },
          requester: { select: { id: true, name: true } },
          lineItems: true,
          response: true,
        },
      });
    });
  }
}
