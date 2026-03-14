import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

/**
 * Standalone repository for budget comments. Append-only — no soft-delete,
 * pagination, or update operations.
 */
@Injectable()
export class BudgetCommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createComment(budgetId: string, userId: string, content: string) {
    return this.prisma.budgetComment.create({
      data: { budgetId, userId, content },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  async findByBudgetId(budgetId: string) {
    return this.prisma.budgetComment.findMany({
      where: { budgetId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }
}
