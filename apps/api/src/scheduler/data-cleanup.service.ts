import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { MetricsService } from '../metrics/metrics.service';
import { PrismaService } from '../prisma/prisma.service';
import { DistributedLockService } from '../redis/distributed-lock.service';

@Injectable()
export class DataCleanupService {
  private readonly logger = new Logger(DataCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lockService: DistributedLockService,
    private readonly metricsService: MetricsService,
  ) {}

  /** Hard-delete soft-deleted records older than 90 days + trim ISV snapshots to 24 months. */
  @Cron('0 3 * * *', { name: 'data-cleanup' })
  async runCleanup(): Promise<void> {
    const start = Date.now();
    await this.lockService.withLock('cron:data-cleanup', 600, async (signal) => {
      this.logger.log('Starting daily data cleanup...');
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60_000);
      const isvCutoff = new Date(Date.now() - 24 * 30 * 24 * 60 * 60_000); // ~24 months

      if (signal.lockLost) return;

      // Hard-delete soft-deleted records older than 90 days.
      // Sequential (no $transaction) to avoid timeout on large datasets.
      // Order: dependents first to respect FK constraints.
      const taskLogs = await this.prisma.taskLog.deleteMany({
        where: { task: { deletedAt: { not: null, lt: cutoff } } },
      });
      const taskNotes = await this.prisma.taskNote.deleteMany({
        where: { task: { deletedAt: { not: null, lt: cutoff } } },
      });
      const taskAuditLogs = await this.prisma.taskAuditLog.deleteMany({
        where: { task: { deletedAt: { not: null, lt: cutoff } } },
      });
      if (signal.lockLost) return;
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
      if (signal.lockLost) return;
      const properties = await this.prisma.property.deleteMany({
        where: { deletedAt: { not: null, lt: cutoff } },
      });
      const users = await this.prisma.user.deleteMany({
        where: { deletedAt: { not: null, lt: cutoff } },
      });
      const deleted = {
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

      this.logger.log(`Soft-delete cleanup: ${JSON.stringify(deleted)}`);

      if (signal.lockLost) return;

      // Trim ISV snapshots older than 24 months
      const isvResult = await this.prisma.iSVSnapshot.deleteMany({
        where: { snapshotDate: { lt: isvCutoff } },
      });
      if (isvResult.count > 0) {
        this.logger.log(`ISV snapshot retention: deleted ${isvResult.count} old snapshots`);
      }

      this.metricsService.recordCronExecution('data-cleanup', Date.now() - start);
    });
  }
}
