import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as Sentry from '@sentry/node';

import { DashboardRepository } from '../dashboard/dashboard.repository';
import { ISVSnapshotRepository } from '../dashboard/isv-snapshot.repository';
import { MetricsService } from '../metrics/metrics.service';
import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { PropertiesRepository } from '../properties/properties.repository';
import { DistributedLockService } from '../redis/distributed-lock.service';

/**
 * Monthly cron job that captures ISV snapshots for all properties
 * and triggers alerts when scores drop significantly.
 *
 * ## Legacy `trend` values in historical snapshots
 * Snapshots created before commit `43f624b` (batch trend fix) stored
 * `trend = 50` because `getPropertyHealthIndexBatch` didn't fetch
 * `olderLogs` and `computeHealthIndex` fell back to the neutral value.
 * From that commit onwards the value is computed correctly.
 *
 * No code currently reads historical `trend`:
 *   - `ISVSnapshotRepository.findLatestForProperties` selects only
 *     `{ propertyId, score, label }`.
 *   - `health-index-card.tsx` renders history using `s.score` only.
 *
 * Because the field is dormant, no backfill is performed. If a future
 * feature starts consuming historical `trend`, a time-machine backfill
 * is required: reconstruct state-at-time-X (task status + log filters by
 * snapshotDate), not the current plan state — otherwise trends for old
 * months would reflect today's activity, not the activity that produced
 * them.
 */
@Injectable()
export class ISVSnapshotService {
  private readonly logger = new Logger(ISVSnapshotService.name);

  constructor(
    private readonly propertiesRepository: PropertiesRepository,
    private readonly dashboardRepository: DashboardRepository,
    private readonly isvRepository: ISVSnapshotRepository,
    private readonly lockService: DistributedLockService,
    private readonly metricsService: MetricsService,
    private readonly notificationsHandler: NotificationsHandlerService,
  ) {}

  /** Runs on the 1st of each month at 02:00 UTC. */
  @Cron('0 2 1 * *', { name: 'isv-monthly-snapshot' })
  async captureMonthlySnapshots(): Promise<void> {
    const start = Date.now();
    try {
      await Sentry.withMonitor(
        'isv-monthly-snapshot',
        () =>
          this.lockService.withLock('cron:isv-monthly-snapshot', 600, async (signal) => {
            this.logger.log('Starting monthly ISV snapshot capture...');

            // Fetch properties with active plans (bounded for safety).
            // Configurable via ISV_MAX_PROPERTIES env var for larger deployments.
            const maxProperties = parseInt(process.env.ISV_MAX_PROPERTIES ?? '10000', 10);
            const properties = await this.propertiesRepository.findWithActivePlans(maxProperties);

            if (signal.lockLost) return;

            const snapshotDate = new Date();
            snapshotDate.setDate(1);
            snapshotDate.setHours(0, 0, 0, 0);

            const BATCH_SIZE = parseInt(process.env.ISV_BATCH_SIZE ?? '10', 10);
            let captured = 0;
            let alerts = 0;

            const eligible = properties.filter((p) => p.maintenancePlan);

            // Pre-load previous snapshots in one batch query to avoid N+1 inside the loop
            const previousSnapshotsMap = await this.isvRepository.findPreviousForProperties(
              eligible.map((p) => p.id),
              snapshotDate,
            );

            for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
              if (signal.lockLost) return;

              const batch = eligible.slice(i, i + BATCH_SIZE);
              const planIds = batch.map((p) => p.maintenancePlan!.id);

              // Batch ISV calculation: 2 queries for N properties instead of 3×N
              const batchIndex =
                await this.dashboardRepository.getPropertyHealthIndexBatch(planIds);

              const results = await Promise.allSettled(
                batch.map(async (prop) => {
                  const index = batchIndex.get(prop.maintenancePlan!.id);
                  if (!index) return { alerted: false };

                  await this.isvRepository.createSnapshot(prop.id, snapshotDate, {
                    score: index.score,
                    label: index.label,
                    compliance: index.dimensions.compliance,
                    condition: index.dimensions.condition,
                    coverage: index.dimensions.coverage,
                    investment: index.dimensions.investment,
                    trend: index.dimensions.trend,
                    sectorScores: index.sectorScores,
                  });

                  // Check for significant drop — uses pre-loaded map (no extra query per property)
                  const previous = previousSnapshotsMap.get(prop.id) ?? null;
                  let alerted = false;
                  if (previous && previous.score - index.score >= 15) {
                    void this.notificationsHandler.handleISVAlert({
                      propertyId: prop.id,
                      userId: prop.userId,
                      address: prop.address,
                      previousScore: previous.score,
                      currentScore: index.score,
                    });
                    alerted = true;
                  }

                  return { alerted };
                }),
              );

              for (let j = 0; j < results.length; j++) {
                const result = results[j]!;
                if (result.status === 'fulfilled') {
                  captured++;
                  if (result.value.alerted) alerts++;
                } else if (result.status === 'rejected') {
                  const reason = result.reason as Error | string;
                  this.logger.error(
                    `Failed to capture ISV for property ${batch[j]?.id}: ${reason instanceof Error ? reason.message : reason}`,
                  );
                }
              }
            }

            this.logger.log(
              `ISV snapshot complete: ${captured} captured, ${alerts} alerts triggered`,
            );
          }),
        { schedule: { type: 'crontab', value: '0 2 1 * *' } },
      );
    } catch (error) {
      this.logger.error(`Cron failed: ${(error as Error).message}`, (error as Error).stack);
      Sentry.captureException(error);
    }
    this.metricsService.recordCronExecution('isv-monthly-snapshot', Date.now() - start);
  }
}
