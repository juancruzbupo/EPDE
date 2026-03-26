import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

/**
 * Append-only repository for budget attachments — does NOT extend BaseRepository.
 *
 * Rationale: Attachments are immutable records (insert + read, never update/delete).
 * BaseRepository's soft-delete extension, pagination, and ownership filtering
 * add complexity without value for this use case. Same pattern as
 * ServiceRequestAttachmentsRepository and all AuditLog repositories.
 */
@Injectable()
export class BudgetAttachmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async addAttachments(budgetId: string, attachments: { url: string; fileName: string }[]) {
    await this.prisma.budgetAttachment.createMany({
      data: attachments.map((a) => ({
        budgetId,
        url: a.url,
        fileName: a.fileName,
      })),
    });
    return this.findByBudgetId(budgetId);
  }

  async findByBudgetId(budgetId: string) {
    return this.prisma.budgetAttachment.findMany({
      where: { budgetId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
