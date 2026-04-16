import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

/**
 * Cross-model cleanup repository — orchestrates hard-deletes across 9+
 * tables to purge soft-deleted rows past the retention window. Does NOT
 * extend `BaseRepository` because the operations span many models, use
 * raw `deleteMany` with custom `deletedAt` filters, and return aggregated
 * counts rather than single-entity reads. See ADR-011 (cross-model).
 */
interface CleanupResult {
  taskLogs: number;
  taskNotes: number;
  taskAuditLogs: number;
  tasks: number;
  budgets: number;
  serviceRequests: number;
  categories: number;
  properties: number;
  users: number;
}

@Injectable()
export class DataCleanupRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Hard-delete soft-deleted records older than cutoff date. Order: dependents first. */
  async hardDeleteSoftDeletedBefore(cutoff: Date): Promise<CleanupResult> {
    // Sequential (no $transaction) to avoid timeout on large datasets.
    const taskLogs = await this.prisma.taskLog.deleteMany({
      where: { task: { deletedAt: { not: null, lt: cutoff } } },
    });
    const taskNotes = await this.prisma.taskNote.deleteMany({
      where: { task: { deletedAt: { not: null, lt: cutoff } } },
    });
    const taskAuditLogs = await this.prisma.taskAuditLog.deleteMany({
      where: { task: { deletedAt: { not: null, lt: cutoff } } },
    });
    const tasks = await this.prisma.task.deleteMany({
      where: { deletedAt: { not: null, lt: cutoff } },
    });
    const budgets = await this.prisma.budgetRequest.deleteMany({
      where: { deletedAt: { not: null, lt: cutoff } },
    });
    const serviceRequests = await this.prisma.serviceRequest.deleteMany({
      where: { deletedAt: { not: null, lt: cutoff } },
    });
    const categories = await this.prisma.category.deleteMany({
      where: { deletedAt: { not: null, lt: cutoff } },
    });
    const properties = await this.prisma.property.deleteMany({
      where: { deletedAt: { not: null, lt: cutoff } },
    });
    const users = await this.prisma.user.deleteMany({
      where: { deletedAt: { not: null, lt: cutoff } },
    });
    return {
      taskLogs: taskLogs.count,
      taskNotes: taskNotes.count,
      taskAuditLogs: taskAuditLogs.count,
      tasks: tasks.count,
      budgets: budgets.count,
      serviceRequests: serviceRequests.count,
      categories: categories.count,
      properties: properties.count,
      users: users.count,
    };
  }

  /** Delete ISV snapshots older than the given date. */
  async deleteOldSnapshots(before: Date): Promise<number> {
    const result = await this.prisma.iSVSnapshot.deleteMany({
      where: { snapshotDate: { lt: before } },
    });
    return result.count;
  }
}
