import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as Sentry from '@sentry/node';

import { MetricsService } from '../metrics/metrics.service';
import { DistributedLockService } from '../redis/distributed-lock.service';
import { DataCleanupRepository } from './data-cleanup.repository';

@Injectable()
export class DataCleanupService {
  private readonly logger = new Logger(DataCleanupService.name);

  constructor(
    private readonly dataCleanupRepository: DataCleanupRepository,
    private readonly lockService: DistributedLockService,
    private readonly metricsService: MetricsService,
  ) {}

  /** Hard-delete soft-deleted records older than 90 days + trim ISV snapshots to 24 months. */
  @Cron('0 3 * * *', { name: 'data-cleanup' })
  async runCleanup(): Promise<void> {
    const start = Date.now();
    try {
      await Sentry.withMonitor(
        'data-cleanup',
        () =>
          this.lockService.withLock('cron:data-cleanup', 600, async (signal) => {
            this.logger.log('Starting daily data cleanup...');
            const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60_000);
            const isvCutoff = new Date(Date.now() - 24 * 30 * 24 * 60 * 60_000); // ~24 months

            if (signal.lockLost) return;

            const deleted = await this.dataCleanupRepository.hardDeleteSoftDeletedBefore(cutoff);

            this.logger.log(`Soft-delete cleanup: ${JSON.stringify(deleted)}`);

            if (signal.lockLost) return;

            // Trim ISV snapshots older than 24 months
            const isvCount = await this.dataCleanupRepository.deleteOldSnapshots(isvCutoff);
            if (isvCount > 0) {
              this.logger.log(`ISV snapshot retention: deleted ${isvCount} old snapshots`);
            }
          }),
        { schedule: { type: 'crontab', value: '0 3 * * *' } },
      );
    } catch (error) {
      this.logger.error(`Cron failed: ${(error as Error).message}`, (error as Error).stack);
      Sentry.captureException(error);
    }
    this.metricsService.recordCronExecution('data-cleanup', Date.now() - start);
  }
}
