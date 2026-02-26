import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { BudgetRequest, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  BaseRepository,
  FindManyParams,
  PaginatedResult,
} from '../common/repositories/base.repository';

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
export class BudgetsRepository extends BaseRepository<BudgetRequest> {
  constructor(prisma: PrismaService) {
    super(prisma, 'budgetRequest', false);
  }

  async findBudgets(params: {
    cursor?: string;
    take?: number;
    status?: string;
    propertyId?: string;
    userId?: string;
  }): Promise<PaginatedResult<BudgetRequest>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.propertyId) {
      where.propertyId = params.propertyId;
    }

    if (params.userId) {
      where.property = { userId: params.userId };
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
      if (!budget || budget.status !== 'PENDING') {
        throw new BadRequestException('Solo se puede cotizar un presupuesto pendiente');
      }
      if (budget.version !== expectedVersion) {
        throw new ConflictException('El presupuesto fue modificado por otro usuario');
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
