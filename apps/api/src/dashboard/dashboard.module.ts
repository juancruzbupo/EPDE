import { Module } from '@nestjs/common';

import { AnalyticsRepository } from './analytics.repository';
import { DashboardController } from './dashboard.controller';
import { DashboardRepository } from './dashboard.repository';
import { DashboardService } from './dashboard.service';
import { DashboardStatsRepository } from './dashboard-stats.repository';
import { HealthIndexRepository } from './health-index.repository';
import { ISVSnapshotRepository } from './isv-snapshot.repository';

@Module({
  controllers: [DashboardController],
  providers: [
    DashboardService,
    DashboardRepository,
    DashboardStatsRepository,
    HealthIndexRepository,
    AnalyticsRepository,
    ISVSnapshotRepository,
  ],
  exports: [
    DashboardRepository,
    DashboardStatsRepository,
    HealthIndexRepository,
    ISVSnapshotRepository,
  ],
})
export class DashboardModule {}
