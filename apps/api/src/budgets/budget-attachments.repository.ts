import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

/**
 * Standalone repository for budget attachments. Pre-uploaded URLs are stored
 * as records (following ServiceRequestPhoto pattern).
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
