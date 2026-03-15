import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

/**
 * Standalone repository — does not extend BaseRepository because audit logs
 * are append-only (no pagination, soft-delete, or update needed). Injects
 * PrismaService directly for simple create/findMany operations on BudgetAuditLog.
 *
 * `createAuditLog` is fire-and-forget safe — errors are caught and logged
 * internally to prevent unhandled rejections from `void` call sites.
 */
@Injectable()
export class BudgetAuditLogRepository {
  private readonly logger = new Logger(BudgetAuditLogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async createAuditLog(
    budgetId: string,
    userId: string,
    action: string,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
  ) {
    try {
      return await this.prisma.budgetAuditLog.create({
        data: {
          budgetId,
          userId,
          action,
          before: before as Prisma.InputJsonValue,
          after: after as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create budget audit log for ${budgetId}: ${(error as Error).message}`,
      );
      return null;
    }
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
