import { PlanStatus } from '@epde/shared';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { DashboardRepository } from '../dashboard/dashboard.repository';
import { ISVSnapshotRepository } from '../dashboard/isv-snapshot.repository';
import { MetricsService } from '../metrics/metrics.service';
import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { PrismaService } from '../prisma/prisma.service';
import { DistributedLockService } from '../redis/distributed-lock.service';

/**
 * Monthly cron job that captures ISV snapshots for all properties
 * and triggers alerts when scores drop significantly.
 */
@Injectable()
export class ISVSnapshotService {
  private readonly logger = new Logger(ISVSnapshotService.name);

  constructor(
    private readonly prisma: PrismaService,
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
    await this.lockService.withLock('cron:isv-monthly-snapshot', 600, async (signal) => {
      this.logger.log('Starting monthly ISV snapshot capture...');

      // Fetch all properties with active plans
      const properties = await this.prisma.property.findMany({
        where: { deletedAt: null, maintenancePlan: { status: PlanStatus.ACTIVE } },
        select: {
          id: true,
          address: true,
          userId: true,
          maintenancePlan: { select: { id: true } },
        },
      });

      if (signal.lockLost) return;

      const snapshotDate = new Date();
      snapshotDate.setDate(1);
      snapshotDate.setHours(0, 0, 0, 0);

      let captured = 0;
      let alerts = 0;

      for (const prop of properties) {
        if (signal.lockLost) return;
        if (!prop.maintenancePlan) continue;

        try {
          const index = await this.dashboardRepository.getPropertyHealthIndex([
            prop.maintenancePlan.id,
          ]);

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

          captured++;

          // Check for significant drop
          const previous = await this.isvRepository.findPrevious(prop.id, snapshotDate);
          if (previous && previous.score - index.score >= 15) {
            void this.notificationsHandler.handleISVAlert({
              propertyId: prop.id,
              userId: prop.userId,
              address: prop.address,
              previousScore: previous.score,
              currentScore: index.score,
            });
            alerts++;
          }
        } catch (error) {
          this.logger.error(
            `Failed to capture ISV for property ${prop.id}: ${(error as Error).message}`,
          );
        }
      }

      this.logger.log(`ISV snapshot complete: ${captured} captured, ${alerts} alerts triggered`);
    });
    this.metricsService.recordCronExecution('isv-monthly-snapshot', Date.now() - start);
  }
}
