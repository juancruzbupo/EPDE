import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

/**
 * Standalone repository — does not extend BaseRepository because audit logs
 * are append-only (no pagination, soft-delete, or update needed). Injects
 * PrismaService directly for simple create/findMany operations on BudgetAuditLog.
 */
@Injectable()
export class BudgetAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createAuditLog(
    budgetId: string,
    userId: string,
    action: string,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
  ) {
    return this.prisma.budgetAuditLog.create({
      data: {
        budgetId,
        userId,
        action,
        before: before as Prisma.InputJsonValue,
        after: after as Prisma.InputJsonValue,
      },
    });
  }

  async findByBudgetId(budgetId: string) {
    return this.prisma.budgetAuditLog.findMany({
      where: { budgetId },
      orderBy: { changedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }
}
