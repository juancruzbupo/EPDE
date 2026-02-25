import { Injectable } from '@nestjs/common';
import { BudgetRequest } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  BaseRepository,
  FindManyParams,
  PaginatedResult,
} from '../common/repositories/base.repository';

const BUDGET_INCLUDE = {
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
      include: BUDGET_INCLUDE,
    };

    return this.findMany(findParams);
  }

  async findByIdWithDetails(id: string): Promise<BudgetRequest | null> {
    return this.findById(id, BUDGET_INCLUDE);
  }
}
